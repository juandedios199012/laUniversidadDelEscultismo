# 🎯 Actividades API - Sistema Scout Lima 12

## 🎯 **Resumen del Módulo**

El módulo de Actividades gestiona la planificación, ejecución y evaluación de todas las actividades del grupo scout. Contiene **~15 funciones** especializadas en gestión de actividades, proyectos especiales y eventos.

**Archivo:** `database/15_functions_actividades.sql`

---

## 🔧 **Funciones Principales**

### **📅 PLANIFICACIÓN DE ACTIVIDADES**

#### **1. Crear Actividad**
```sql
crear_actividad(
  p_titulo VARCHAR(200),
  p_descripcion TEXT,
  p_tipo_actividad tipo_actividad_enum,
  p_rama_objetivo rama_enum[] DEFAULT NULL,
  p_fecha_inicio TIMESTAMP,
  p_fecha_fin TIMESTAMP DEFAULT NULL,
  p_lugar VARCHAR(200),
  p_objetivos_educativos JSON DEFAULT '{}',
  p_recursos_necesarios JSON DEFAULT '{}',
  p_presupuesto_estimado DECIMAL(10,2) DEFAULT 0.00,
  p_capacidad_maxima INTEGER DEFAULT NULL,
  p_edad_minima INTEGER DEFAULT NULL,
  p_edad_maxima INTEGER DEFAULT NULL,
  p_requiere_autorizacion BOOLEAN DEFAULT false,
  p_creado_por_id UUID
) RETURNS JSON
```

**Tipos de actividad:**
- `REUNION_SEMANAL` - Reunión semanal regular
- `CAMPAMENTO` - Campamento de fin de semana o vacaciones
- `EXCURSION` - Excursión o salida de día
- `SERVICIO_COMUNITARIO` - Actividad de servicio a la comunidad
- `CEREMONIA` - Ceremonia o acto scout
- `TALLER_ESPECIALIDAD` - Taller de especialidad
- `ACTIVIDAD_DISTRITO` - Actividad a nivel distrito
- `ACTIVIDAD_NACIONAL` - Actividad a nivel nacional
- `PROYECTO_ESPECIAL` - Proyecto especial o de largo plazo
- `COMPETENCIA` - Competencia o concurso
- `INTERCAMBIO` - Intercambio con otros grupos
- `CAPACITACION` - Capacitación para dirigentes

**Ejemplo:**
```sql
SELECT crear_actividad(
  p_titulo := 'Campamento de Verano 2025',
  p_descripcion := 'Campamento de 3 días en la sierra de Lima con actividades de aventura, naturaleza y convivencia.',
  p_tipo_actividad := 'CAMPAMENTO',
  p_rama_objetivo := ARRAY['SCOUTS', 'VENTURES']::rama_enum[],
  p_fecha_inicio := '2025-01-15 08:00:00',
  p_fecha_fin := '2025-01-17 18:00:00',
  p_lugar := 'Campamento Huacachina, Ica',
  p_objetivos_educativos := '{
    "desarrollo_personal": [
      "Fortalecer la autonomía y responsabilidad personal",
      "Desarrollar habilidades de supervivencia"
    ],
    "desarrollo_social": [
      "Mejorar la cooperación en equipo",
      "Fortalecer vínculos entre patrullas"
    ],
    "desarrollo_fisico": [
      "Actividades de aventura y deportes",
      "Contacto con la naturaleza"
    ],
    "desarrollo_espiritual": [
      "Reflexión en contacto con la naturaleza",
      "Ceremonia de fuego de campamento"
    ]
  }'::json,
  p_recursos_necesarios := '{
    "equipamiento": ["Carpas", "Equipo de cocina", "Botiquín"],
    "personal": ["2 dirigentes por patrulla", "Enfermero", "Cocinero"],
    "transporte": ["Bus para 50 personas"],
    "alimentacion": ["Desayunos: 2", "Almuerzos: 3", "Cenas: 2"]
  }'::json,
  p_presupuesto_estimado := 2500.00,
  p_capacidad_maxima := 45,
  p_edad_minima := 11,
  p_edad_maxima := 17,
  p_requiere_autorizacion := true,
  p_creado_por_id := 'dir123-456-789'
);
```

#### **2. Programar Actividad Recurrente**
```sql
programar_actividad_recurrente(
  p_actividad_base_id UUID,
  p_patron_recurrencia patron_recurrencia_enum,
  p_frecuencia INTEGER DEFAULT 1,
  p_dias_semana INTEGER[] DEFAULT NULL,
  p_fecha_inicio DATE,
  p_fecha_fin DATE DEFAULT NULL,
  p_excepciones DATE[] DEFAULT NULL
) RETURNS JSON
```

**Patrones de recurrencia:**
- `SEMANAL` - Cada semana en días específicos
- `QUINCENAL` - Cada dos semanas
- `MENSUAL` - Una vez al mes
- `BIMENSUAL` - Cada dos meses
- `TRIMESTRAL` - Cada tres meses
- `ANUAL` - Una vez al año

#### **3. Actualizar Actividad**
```sql
actualizar_actividad(
  p_actividad_id UUID,
  p_campos_actualizar JSON,
  p_actualizado_por_id UUID,
  p_razon_cambio TEXT DEFAULT NULL
) RETURNS JSON
```

---

### **👥 GESTIÓN DE PARTICIPANTES**

#### **4. Inscribir Participante en Actividad**
```sql
inscribir_participante_actividad(
  p_actividad_id UUID,
  p_scout_id UUID,
  p_estado_inscripcion estado_inscripcion_enum DEFAULT 'PENDIENTE',
  p_observaciones TEXT DEFAULT NULL,
  p_requiere_transporte BOOLEAN DEFAULT false,
  p_requiere_alimentacion BOOLEAN DEFAULT true,
  p_contacto_emergencia JSON DEFAULT NULL,
  p_inscrito_por_id UUID
) RETURNS JSON
```

**Estados de inscripción:**
- `PENDIENTE` - Inscripción pendiente de aprobación
- `CONFIRMADO` - Participación confirmada
- `LISTA_ESPERA` - En lista de espera
- `CANCELADO` - Inscripción cancelada
- `NO_PRESENTO` - No se presentó el día de la actividad

#### **5. Gestionar Lista de Espera**
```sql
gestionar_lista_espera(
  p_actividad_id UUID,
  p_accion VARCHAR(50),
  p_scout_id UUID DEFAULT NULL
) RETURNS JSON
```

**Acciones disponibles:**
- `PROMOCIONAR_SIGUIENTE` - Promocionar siguiente en lista
- `PROMOCIONAR_SCOUT` - Promocionar scout específico
- `ACTUALIZAR_ESTADO` - Actualizar estado de lista
- `OBTENER_POSICION` - Obtener posición en lista

#### **6. Obtener Participantes de Actividad**
```sql
obtener_participantes_actividad(
  p_actividad_id UUID,
  p_incluir_dirigentes BOOLEAN DEFAULT true,
  p_incluir_estadisticas BOOLEAN DEFAULT false
) RETURNS JSON
```

---

### **📋 PLANIFICACIÓN Y RECURSOS**

#### **7. Asignar Responsables a Actividad**
```sql
asignar_responsables_actividad(
  p_actividad_id UUID,
  p_responsables JSON,
  p_asignado_por_id UUID
) RETURNS JSON
```

**Estructura de responsables:**
```json
{
  "coordinador_general": "dir123-456-789",
  "responsables_rama": {
    "SCOUTS": ["dir234-567-890"],
    "VENTURES": ["dir345-678-901"]
  },
  "especialistas": {
    "primeros_auxilios": "dir456-789-012",
    "actividades_acuaticas": "dir567-890-123",
    "cocina": "vol678-901-234"
  },
  "apoyo": ["vol789-012-345", "vol890-123-456"]
}
```

#### **8. Planificar Recursos de Actividad**
```sql
planificar_recursos_actividad(
  p_actividad_id UUID,
  p_inventario_necesario JSON,
  p_recursos_externos JSON DEFAULT '{}',
  p_presupuesto_detallado JSON DEFAULT '{}',
  p_planificado_por_id UUID
) RETURNS JSON
```

#### **9. Generar Cronograma de Actividad**
```sql
generar_cronograma_actividad(
  p_actividad_id UUID,
  p_bloques_horarios JSON,
  p_actividades_paralelas JSON DEFAULT '{}',
  p_puntos_reunion JSON DEFAULT '{}'
) RETURNS JSON
```

**Ejemplo de cronograma:**
```sql
SELECT generar_cronograma_actividad(
  p_actividad_id := 'act123-456-789',
  p_bloques_horarios := '[
    {
      "hora_inicio": "08:00",
      "hora_fin": "09:00",
      "actividad": "Llegada y registro",
      "responsable": "Dirigentes",
      "lugar": "Entrada del campamento"
    },
    {
      "hora_inicio": "09:00",
      "hora_fin": "10:30",
      "actividad": "Ceremonia de apertura",
      "responsable": "Jefe de Grupo",
      "lugar": "Plaza central"
    },
    {
      "hora_inicio": "10:30",
      "hora_fin": "12:00",
      "actividad": "Actividades por patrulla",
      "responsable": "Guías de patrulla",
      "lugar": "Sectores asignados"
    }
  ]'::json
);
```

---

### **📊 SEGUIMIENTO Y EVALUACIÓN**

#### **10. Registrar Asistencia a Actividad**
```sql
registrar_asistencia_actividad(
  p_actividad_id UUID,
  p_asistencias JSON,
  p_fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  p_registrado_por_id UUID
) RETURNS JSON
```

#### **11. Evaluar Actividad**
```sql
evaluar_actividad(
  p_actividad_id UUID,
  p_evaluacion_dirigentes JSON,
  p_evaluacion_participantes JSON DEFAULT '{}',
  p_logros_objetivos JSON DEFAULT '{}',
  p_mejoras_sugeridas TEXT DEFAULT NULL,
  p_calificacion_general DECIMAL(3,1) DEFAULT NULL,
  p_evaluado_por_id UUID
) RETURNS JSON
```

**Estructura de evaluación:**
```json
{
  "objetivos_cumplidos": {
    "desarrollo_personal": 85,
    "desarrollo_social": 92,
    "desarrollo_fisico": 78,
    "desarrollo_espiritual": 88
  },
  "aspectos_destacados": [
    "Excelente participación de todos los scouts",
    "Buena organización del cronograma",
    "Actividades variadas y atractivas"
  ],
  "areas_mejora": [
    "Mejor coordinación en transporte",
    "Más tiempo para actividades de reflexión"
  ],
  "recursos_utilizados": {
    "presupuesto_ejecutado": 2350.00,
    "eficiencia_presupuestal": 94.0
  },
  "participacion": {
    "total_inscritos": 45,
    "total_asistentes": 42,
    "tasa_asistencia": 93.3
  }
}
```

#### **12. Obtener Historial de Actividades**
```sql
obtener_historial_actividades(
  p_rama rama_enum DEFAULT NULL,
  p_tipo_actividad tipo_actividad_enum DEFAULT NULL,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_incluir_evaluaciones BOOLEAN DEFAULT false
) RETURNS JSON
```

---

### **🎯 PROYECTOS ESPECIALES**

#### **13. Crear Proyecto de Largo Plazo**
```sql
crear_proyecto_largo_plazo(
  p_nombre_proyecto VARCHAR(200),
  p_descripcion_proyecto TEXT,
  p_rama_participante rama_enum[],
  p_fecha_inicio DATE,
  p_fecha_fin_estimada DATE,
  p_objetivos_proyecto JSON,
  p_hitos_principales JSON,
  p_coordinador_proyecto_id UUID
) RETURNS JSON
```

#### **14. Registrar Avance de Proyecto**
```sql
registrar_avance_proyecto(
  p_proyecto_id UUID,
  p_hito_completado VARCHAR(200),
  p_porcentaje_avance DECIMAL(5,2),
  p_evidencias JSON DEFAULT '{}',
  p_observaciones TEXT DEFAULT NULL,
  p_registrado_por_id UUID
) RETURNS JSON
```

---

### **📈 REPORTES Y ESTADÍSTICAS**

#### **15. Generar Reporte de Actividades**
```sql
generar_reporte_actividades(
  p_periodo_desde DATE,
  p_periodo_hasta DATE,
  p_rama rama_enum DEFAULT NULL,
  p_incluir_metricas BOOLEAN DEFAULT true
) RETURNS JSON
```

**Respuesta del reporte:**
```json
{
  "success": true,
  "data": {
    "resumen_periodo": {
      "fecha_desde": "2024-01-01",
      "fecha_hasta": "2024-12-31",
      "total_actividades": 156,
      "actividades_por_tipo": {
        "REUNION_SEMANAL": 48,
        "CAMPAMENTO": 8,
        "EXCURSION": 12,
        "SERVICIO_COMUNITARIO": 6,
        "CEREMONIA": 4,
        "OTROS": 78
      }
    },
    "participacion": {
      "promedio_asistencia": 87.5,
      "scouts_mas_activos": [
        {"scout_id": "scout123", "actividades": 89},
        {"scout_id": "scout456", "actividades": 85}
      ],
      "scouts_baja_participacion": [
        {"scout_id": "scout789", "actividades": 12}
      ]
    },
    "evaluaciones": {
      "calificacion_promedio": 4.3,
      "actividades_mejor_evaluadas": [
        {"actividad": "Campamento Verano", "calificacion": 4.9},
        {"actividad": "Servicio Hospital", "calificacion": 4.8}
      ],
      "objetivos_cumplimiento": {
        "desarrollo_personal": 88.2,
        "desarrollo_social": 91.5,
        "desarrollo_fisico": 85.1,
        "desarrollo_espiritual": 89.3
      }
    },
    "presupuesto": {
      "presupuesto_total": 15000.00,
      "presupuesto_ejecutado": 14250.00,
      "eficiencia_presupuestal": 95.0
    }
  }
}
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Capacidad máxima** - No exceder límite de participantes
- ✅ **Edades apropiadas** - Verificar rangos de edad
- ✅ **Conflictos de horarios** - Evitar superposición de actividades
- ✅ **Disponibilidad de recursos** - Verificar inventario disponible
- ✅ **Autorizaciones requeridas** - Para actividades que lo requieran

### **Reglas de Programación:**
```sql
-- Actividades no pueden superponerse para misma rama
-- Mínimo 2 dirigentes por cada 15 scouts menores de 14 años
-- Máximo 30 días de anticipación para inscripciones de campamentos
-- Evaluación obligatoria para actividades de más de 4 horas
-- Presupuesto debe estar aprobado antes de confirmar actividad
```

---

## 📅 **Calendario de Actividades**

### **Actividades Regulares:**
```sql
-- Reuniones semanales: todos los sábados 15:00-18:00
-- Campamentos: primer fin de semana de cada mes
-- Ceremonias: fechas scout importantes
-- Servicios comunitarios: un sábado al mes
```

### **Actividades Especiales:**
```sql
-- Campamento de verano: enero
-- Campamento de invierno: julio
-- Día del Scout: 23 de abril
-- Día de la Promesa: fechas variables por rama
-- Intercambios: según coordinación con otros grupos
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_actividades();

-- Simular planificación de campamento
SELECT test_planificacion_campamento_completa();

-- Test de inscripciones masivas
SELECT test_inscripciones_masivas_actividad();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  tipoActividad: TipoActividad;
  ramaObjetivo: Rama[];
  fechaInicio: string;
  fechaFin?: string;
  lugar: string;
  objetivosEducativos: ObjetivosEducativos;
  recursosNecesarios: RecursosNecesarios;
  presupuestoEstimado: number;
  capacidadMaxima?: number;
  participantes: ParticipanteActividad[];
  estado: EstadoActividad;
}

export class ActividadesService {
  static async crearActividad(actividad: CrearActividadData): Promise<Actividad> {
    const response = await DatabaseFunctions.callFunction('crear_actividad', {
      p_titulo: actividad.titulo,
      p_descripcion: actividad.descripcion,
      p_tipo_actividad: actividad.tipoActividad,
      p_rama_objetivo: actividad.ramaObjetivo,
      p_fecha_inicio: actividad.fechaInicio,
      p_fecha_fin: actividad.fechaFin,
      p_lugar: actividad.lugar,
      p_objetivos_educativos: actividad.objetivosEducativos,
      p_recursos_necesarios: actividad.recursosNecesarios,
      p_presupuesto_estimado: actividad.presupuestoEstimado,
      p_creado_por_id: actividad.creadoPorId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async inscribirParticipante(inscripcion: InscribirParticipanteData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('inscribir_participante_actividad', {
      p_actividad_id: inscripcion.actividadId,
      p_scout_id: inscripcion.scoutId,
      p_requiere_transporte: inscripcion.requiereTransporte,
      p_requiere_alimentacion: inscripcion.requiereAlimentacion,
      p_contacto_emergencia: inscripcion.contactoEmergencia,
      p_inscrito_por_id: inscripcion.inscritoPorId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
  
  static async evaluarActividad(evaluacion: EvaluarActividadData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('evaluar_actividad', {
      p_actividad_id: evaluacion.actividadId,
      p_evaluacion_dirigentes: evaluacion.evaluacionDirigentes,
      p_evaluacion_participantes: evaluacion.evaluacionParticipantes,
      p_logros_objetivos: evaluacion.logrosObjetivos,
      p_calificacion_general: evaluacion.calificacionGeneral,
      p_evaluado_por_id: evaluacion.evaluadoPorId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Planificar Campamento de Fin de Semana:**
```sql
-- 1. Crear actividad base
SELECT crear_actividad(
  'Campamento de Aventura', descripcion, 'CAMPAMENTO', 
  ARRAY['SCOUTS'], fecha_inicio, fecha_fin, lugar, objetivos, recursos
);

-- 2. Asignar responsables
SELECT asignar_responsables_actividad(actividad_id, responsables_json);

-- 3. Planificar recursos
SELECT planificar_recursos_actividad(actividad_id, inventario_necesario);

-- 4. Generar cronograma
SELECT generar_cronograma_actividad(actividad_id, bloques_horarios);

-- 5. Abrir inscripciones
-- (Los scouts/padres se inscriben mediante la aplicación)

-- 6. Gestionar lista de espera si es necesario
SELECT gestionar_lista_espera(actividad_id, 'PROMOCIONAR_SIGUIENTE');
```

### **2. Registro de Reunión Semanal:**
```sql
-- 1. Registrar asistencia
SELECT registrar_asistencia_actividad(reunion_id, asistencias_json);

-- 2. Evaluar reunión
SELECT evaluar_actividad(reunion_id, evaluacion_dirigentes);
```

### **3. Seguimiento de Proyecto Anual:**
```sql
-- 1. Crear proyecto
SELECT crear_proyecto_largo_plazo(
  'Proyecto Medio Ambiente 2025', descripcion, ramas, 
  fecha_inicio, fecha_fin, objetivos, hitos
);

-- 2. Registrar avances mensuales
SELECT registrar_avance_proyecto(proyecto_id, hito, porcentaje, evidencias);

-- 3. Evaluación final
SELECT evaluar_actividad(proyecto_final_id, evaluacion_completa);
```

---

**📈 Total: 15 funciones implementadas para gestión completa de actividades**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**