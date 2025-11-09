# 👨‍👩‍👧‍👦 Comité de Padres API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Comité de Padres gestiona la participación, comunicación, reuniones y colaboración de los padres de familia en las actividades del grupo scout. Contiene **~15 funciones** para la administración completa del comité de padres.

**Archivo:** `database/11_functions_comite_padres.sql`

---

## 🔧 **Funciones Principales**

### **👥 GESTIÓN DE MIEMBROS DEL COMITÉ**

#### **1. Registrar Padre en Comité**
```sql
registrar_padre_comite(
  p_nombre VARCHAR(100),
  p_apellidos VARCHAR(150),
  p_email VARCHAR(200),
  p_telefono VARCHAR(20),
  p_scout_hijo_id UUID,
  p_cargo_comite cargo_comite_enum DEFAULT 'MIEMBRO',
  p_profesion VARCHAR(100) DEFAULT NULL,
  p_especialidad VARCHAR(200) DEFAULT NULL,
  p_disponibilidad_horaria JSON DEFAULT '{}',
  p_areas_interes JSON DEFAULT '[]'
) RETURNS JSON
```

**Cargos en comité:**
- `PRESIDENTE` - Presidente del comité
- `VICEPRESIDENTE` - Vicepresidente
- `SECRETARIO` - Secretario del comité
- `TESORERO` - Tesorero del comité
- `VOCAL` - Vocal del comité
- `COORDINADOR_ACTIVIDADES` - Coordinador de actividades
- `COORDINADOR_LOGISTICA` - Coordinador de logística
- `MIEMBRO` - Miembro regular

**Ejemplo:**
```sql
SELECT registrar_padre_comite(
  p_nombre := 'Carlos Alberto',
  p_apellidos := 'Pérez González',
  p_email := 'carlos.perez@email.com',
  p_telefono := '987654321',
  p_scout_hijo_id := 'scout123-456-789',
  p_cargo_comite := 'COORDINADOR_ACTIVIDADES',
  p_profesion := 'Ingeniero de Sistemas',
  p_especialidad := 'Organización de eventos y tecnología',
  p_disponibilidad_horaria := '{
    "dias_semana": ["sabado", "domingo"],
    "horarios": ["manana", "tarde"],
    "flexibilidad": "alta"
  }'::json,
  p_areas_interes := '["tecnologia", "campamentos", "transporte", "fotografia"]'::json
);
```

#### **2. Actualizar Información Padre**
```sql
actualizar_informacion_padre(
  p_padre_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **3. Obtener Miembros del Comité**
```sql
obtener_miembros_comite(
  p_incluir_inactivos BOOLEAN DEFAULT false,
  p_cargo_especifico cargo_comite_enum DEFAULT NULL
) RETURNS JSON
```

#### **4. Buscar Padres por Especialidad**
```sql
buscar_padres_por_especialidad(
  p_especialidades JSON,
  p_disponible_fecha DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

---

### **📅 GESTIÓN DE REUNIONES**

#### **5. Programar Reunión Comité**
```sql
programar_reunion_comite(
  p_fecha_reunion DATE,
  p_hora_inicio TIME,
  p_duracion_estimada INTEGER DEFAULT 120,
  p_tipo_reunion tipo_reunion_comite_enum,
  p_agenda JSON,
  p_ubicacion VARCHAR(200) DEFAULT NULL,
  p_modalidad modalidad_reunion_enum DEFAULT 'PRESENCIAL',
  p_convocado_por_id UUID
) RETURNS JSON
```

**Tipos de reunión:**
- `ORDINARIA` - Reunión ordinaria mensual
- `EXTRAORDINARIA` - Reunión extraordinaria
- `PLANIFICACION` - Reunión de planificación de actividades
- `EVALUACION` - Reunión de evaluación de actividades
- `INFORMATIVA` - Reunión informativa
- `COORDINACION` - Reunión de coordinación específica

**Modalidades:**
- `PRESENCIAL` - Reunión presencial
- `VIRTUAL` - Reunión virtual
- `HIBRIDA` - Reunión híbrida

**Ejemplo:**
```sql
SELECT programar_reunion_comite(
  p_fecha_reunion := '2024-11-15',
  p_hora_inicio := '19:00:00',
  p_duracion_estimada := 90,
  p_tipo_reunion := 'ORDINARIA',
  p_agenda := '{
    "puntos": [
      {
        "orden": 1,
        "tema": "Revisión de actividades del mes",
        "responsable": "Presidente",
        "tiempo_estimado": 20
      },
      {
        "orden": 2,
        "tema": "Planificación campamento de fin de año",
        "responsable": "Coordinador de Actividades",
        "tiempo_estimado": 30
      },
      {
        "orden": 3,
        "tema": "Informe financiero",
        "responsable": "Tesorero",
        "tiempo_estimado": 15
      }
    ]
  }'::json,
  p_ubicacion := 'Local Scout - Sala de Reuniones',
  p_modalidad := 'HIBRIDA',
  p_convocado_por_id := 'padre123-456-789'
);
```

#### **6. Registrar Asistencia Reunión**
```sql
registrar_asistencia_reunion_comite(
  p_reunion_id UUID,
  p_padre_id UUID,
  p_presente BOOLEAN,
  p_modalidad_asistencia modalidad_reunion_enum DEFAULT 'PRESENCIAL',
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

#### **7. Generar Acta de Reunión**
```sql
generar_acta_reunion(
  p_reunion_id UUID,
  p_resumen_puntos JSON,
  p_acuerdos_tomados JSON,
  p_tareas_asignadas JSON,
  p_observaciones_generales TEXT DEFAULT NULL,
  p_secretario_id UUID
) RETURNS JSON
```

---

### **🎯 COORDINACIÓN DE ACTIVIDADES**

#### **8. Asignar Responsabilidad en Actividad**
```sql
asignar_responsabilidad_actividad(
  p_actividad_id UUID,
  p_padre_id UUID,
  p_tipo_responsabilidad VARCHAR(100),
  p_descripcion_tareas TEXT,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE,
  p_fecha_fin DATE DEFAULT NULL,
  p_requiere_coordinacion BOOLEAN DEFAULT false
) RETURNS JSON
```

**Tipos de responsabilidad:**
- `COORDINACION_GENERAL` - Coordinación general de actividad
- `LOGISTICA` - Logística y organización
- `TRANSPORTE` - Coordinación de transporte
- `ALIMENTACION` - Coordinación de alimentación
- `SEGURIDAD` - Responsabilidad de seguridad
- `DOCUMENTACION` - Documentación y fotografía
- `FINANZAS` - Gestión financiera de la actividad
- `COMUNICACION` - Comunicación con padres

#### **9. Obtener Disponibilidad Padres**
```sql
obtener_disponibilidad_padres(
  p_fecha_actividad DATE,
  p_tipo_actividad VARCHAR(100) DEFAULT NULL,
  p_especialidades_requeridas JSON DEFAULT '[]'
) RETURNS JSON
```

#### **10. Generar Reporte Participación**
```sql
generar_reporte_participacion_padres(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_incluir_estadisticas BOOLEAN DEFAULT true
) RETURNS JSON
```

---

### **📱 COMUNICACIÓN Y NOTIFICACIONES**

#### **11. Enviar Comunicado Comité**
```sql
enviar_comunicado_comite(
  p_asunto VARCHAR(200),
  p_mensaje TEXT,
  p_tipo_comunicado tipo_comunicado_enum,
  p_destinatarios JSON DEFAULT '[]',
  p_prioridad prioridad_enum DEFAULT 'NORMAL',
  p_requiere_confirmacion BOOLEAN DEFAULT false,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_adjuntos JSON DEFAULT '[]'
) RETURNS JSON
```

**Tipos de comunicado:**
- `INFORMATIVO` - Comunicado informativo
- `CONVOCATORIA` - Convocatoria a reunión o actividad
- `URGENTE` - Comunicado urgente
- `SOLICITUD_APOYO` - Solicitud de apoyo/voluntarios
- `AGRADECIMIENTO` - Agradecimiento por colaboración
- `RECORDATORIO` - Recordatorio de fechas importantes

#### **12. Obtener Comunicados Recientes**
```sql
obtener_comunicados_recientes(
  p_limite INTEGER DEFAULT 20,
  p_padre_id UUID DEFAULT NULL,
  p_solo_no_leidos BOOLEAN DEFAULT false
) RETURNS JSON
```

#### **13. Registrar Feedback Padres**
```sql
registrar_feedback_padres(
  p_actividad_id UUID DEFAULT NULL,
  p_reunion_id UUID DEFAULT NULL,
  p_padre_id UUID,
  p_tipo_feedback VARCHAR(50),
  p_calificacion INTEGER DEFAULT NULL,
  p_comentarios TEXT DEFAULT NULL,
  p_sugerencias TEXT DEFAULT NULL,
  p_anonimo BOOLEAN DEFAULT false
) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS Y REPORTES**

#### **14. Estadísticas Generales Comité**
```sql
obtener_estadisticas_comite() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_padres_registrados": 85,
    "padres_activos": 78,
    "participacion_promedio_reuniones": 65.8,
    "por_cargo": {
      "PRESIDENTE": 1,
      "VICEPRESIDENTE": 1,
      "SECRETARIO": 1,
      "TESORERO": 1,
      "VOCAL": 4,
      "COORDINADOR_ACTIVIDADES": 3,
      "COORDINADOR_LOGISTICA": 2,
      "MIEMBRO": 65
    },
    "especialidades_disponibles": [
      {"especialidad": "Medicina/Primeros Auxilios", "cantidad": 8},
      {"especialidad": "Transporte", "cantidad": 15},
      {"especialidad": "Cocina/Alimentación", "cantidad": 12},
      {"especialidad": "Fotografía/Video", "cantidad": 6},
      {"especialidad": "Tecnología", "cantidad": 9}
    ],
    "reuniones_ultimo_semestre": 6,
    "asistencia_promedio": 45,
    "actividades_coordinadas": 12
  }
}
```

#### **15. Análisis de Participación por Actividad**
```sql
analizar_participacion_por_actividad(
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '6 months',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Email único** - No permitir emails duplicados
- ✅ **Un padre por scout** - Relación padre-hijo principal única
- ✅ **Cargos directivos únicos** - Solo un presidente, tesorero, etc.
- ✅ **Disponibilidad coherente** - Verificar disponibilidad antes de asignar
- ✅ **Especialidades verificadas** - Validar especialidades declaradas

### **Reglas de Participación:**
```sql
-- Rotación de cargos directivos cada 2 años
-- Participación mínima en 3 reuniones por semestre
-- Máximo 2 responsabilidades simultáneas por padre
-- Evaluación anual de satisfacción del comité
```

---

## 📊 **Dashboard y Métricas**

### **KPIs del Comité:**
```sql
-- Métricas de participación
SELECT obtener_kpis_comite();

-- Resultado esperado:
{
  "nivel_participacion": 78.5,
  "satisfaccion_promedio": 4.2,
  "reuniones_quorum": 85.7,
  "actividades_con_apoyo_padres": 92.3,
  "comunicados_leidos_promedio": 89.4,
  "padres_multiples_responsabilidades": 15
}
```

### **Índices de Performance:**
- `idx_comite_email` - Búsqueda por email único
- `idx_comite_scout_hijo` - Relación padre-scout
- `idx_reuniones_fecha` - Reuniones por fecha
- `idx_responsabilidades_actividad` - Responsabilidades por actividad

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_comite_padres();

-- Generar datos de prueba
SELECT generar_datos_prueba_comite(50);

-- Test de comunicaciones
SELECT test_sistema_comunicados();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface PadreComite {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  scoutHijo: Scout;
  cargoComite: CargoComite;
  profesion?: string;
  especialidades: string[];
  disponibilidad: DisponibilidadHoraria;
  participacionActiva: boolean;
}

export class ComitePadresService {
  static async registrarPadre(padre: RegistroPadreData): Promise<PadreComite> {
    const response = await DatabaseFunctions.callFunction('registrar_padre_comite', {
      p_nombre: padre.nombre,
      p_apellidos: padre.apellidos,
      p_email: padre.email,
      p_telefono: padre.telefono,
      p_scout_hijo_id: padre.scoutHijoId,
      p_cargo_comite: padre.cargoComite,
      p_profesion: padre.profesion,
      p_especialidad: padre.especialidades?.join(', '),
      p_disponibilidad_horaria: padre.disponibilidad,
      p_areas_interes: padre.areasInteres
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async programarReunion(reunion: ProgramarReunionData): Promise<string> {
    const response = await DatabaseFunctions.callFunction('programar_reunion_comite', {
      p_fecha_reunion: reunion.fecha,
      p_hora_inicio: reunion.horaInicio,
      p_tipo_reunion: reunion.tipo,
      p_agenda: reunion.agenda,
      p_ubicacion: reunion.ubicacion,
      p_modalidad: reunion.modalidad
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data.reunion_id;
  }
  
  static async obtenerEstadisticas(): Promise<EstadisticasComite> {
    const response = await DatabaseFunctions.callFunction('obtener_estadisticas_comite');
    return response.success ? response.data : null;
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Organización de Reunión Mensual:**
```sql
-- 1. Programar reunión
SELECT programar_reunion_comite(
  '2024-11-15', '19:00:00', 90, 'ORDINARIA', agenda_json
);

-- 2. Enviar convocatoria
SELECT enviar_comunicado_comite(
  'Convocatoria Reunión Ordinaria Noviembre',
  'Se convoca a reunión ordinaria...',
  'CONVOCATORIA'
);

-- 3. Registrar asistencias
SELECT registrar_asistencia_reunion_comite(reunion_id, padre_id, true);

-- 4. Generar acta
SELECT generar_acta_reunion(reunion_id, resumen_json, acuerdos_json);
```

### **2. Coordinación de Campamento:**
```sql
-- 1. Buscar padres disponibles
SELECT obtener_disponibilidad_padres('2024-12-15', 'CAMPAMENTO');

-- 2. Asignar responsabilidades
SELECT asignar_responsabilidad_actividad(
  campamento_id, padre_id, 'TRANSPORTE', 'Coordinar buses'
);

-- 3. Enviar comunicado organizativo
SELECT enviar_comunicado_comite(
  'Coordinación Campamento Diciembre',
  'Detalles y responsabilidades...',
  'INFORMATIVO'
);
```

### **3. Gestión de Feedback:**
```sql
-- Solicitar feedback post-actividad
SELECT enviar_comunicado_comite(
  'Evaluación Actividad Familiar',
  'Por favor evalúen la actividad...',
  'SOLICITUD_APOYO'
);

-- Recopilar feedback
SELECT registrar_feedback_padres(
  actividad_id, padre_id, 'ACTIVIDAD', 4, 'Muy buena organización'
);

-- Analizar resultados
SELECT analizar_participacion_por_actividad();
```

---

**📈 Total: 15 funciones implementadas para gestión completa del comité de padres**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**