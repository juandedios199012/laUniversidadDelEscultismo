# 👤 Scouts API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Scouts gestiona el registro, actualización y consulta de información de scouts, incluyendo datos personales, familiares y de progresión. Contiene **~30 funciones** para la gestión completa del ciclo de vida de un scout.

**Archivo:** `database/06_functions_scouts.sql`

---

## 🔧 **Funciones Principales**

### **📝 GESTIÓN DE SCOUTS**

#### **1. Registrar Scout**
```sql
registrar_scout(
  p_nombre VARCHAR(100),
  p_apellidos VARCHAR(150),
  p_fecha_nacimiento DATE,
  p_rama rama_enum,
  p_datos_contacto JSON DEFAULT '{}',
  p_datos_familia JSON DEFAULT '{}',
  p_dirigente_id UUID DEFAULT NULL
) RETURNS JSON
```

**Descripción:** Registra un nuevo scout en el sistema con validación completa.

**Parámetros:**
- `p_nombre` - Nombre del scout (mínimo 2 caracteres)
- `p_apellidos` - Apellidos completos
- `p_fecha_nacimiento` - Fecha de nacimiento (debe ser coherente con la rama)
- `p_rama` - Rama scout: 'CASTORES', 'LOBATOS', 'SCOUTS', 'VENTURES', 'ROVERS'
- `p_datos_contacto` - JSON con información de contacto
- `p_datos_familia` - JSON con información familiar
- `p_dirigente_id` - UUID del dirigente responsable (opcional)

**Ejemplo de Uso:**
```sql
SELECT registrar_scout(
  p_nombre := 'Juan Carlos',
  p_apellidos := 'Pérez García',
  p_fecha_nacimiento := '2010-05-15',
  p_rama := 'LOBATOS',
  p_datos_contacto := '{
    "telefono": "987654321",
    "email": "juan@email.com",
    "direccion": "Av. Principal 123, Lima"
  }'::json,
  p_datos_familia := '{
    "padre": "Carlos Pérez",
    "madre": "María García",
    "telefono_emergencia": "987123456"
  }'::json
);
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": {
    "scout_id": "123e4567-e89b-12d3-a456-426614174000",
    "numero_scout": "SC2024001",
    "rama": "LOBATOS",
    "estado": "ACTIVO",
    "fecha_registro": "2024-10-24T10:30:00Z"
  },
  "message": "Scout registrado exitosamente"
}
```

#### **2. Obtener Scout por ID**
```sql
obtener_scout_por_id(p_scout_id UUID) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT obtener_scout_por_id('123e4567-e89b-12d3-a456-426614174000');
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "numero_scout": "SC2024001",
    "nombre": "Juan Carlos",
    "apellidos": "Pérez García",
    "fecha_nacimiento": "2010-05-15",
    "edad": 14,
    "rama": "LOBATOS",
    "estado": "ACTIVO",
    "datos_contacto": {
      "telefono": "987654321",
      "email": "juan@email.com"
    },
    "datos_familia": {
      "padre": "Carlos Pérez",
      "madre": "María García"
    },
    "fecha_registro": "2024-10-24T10:30:00Z",
    "patrulla": {
      "id": "pat123",
      "nombre": "Águilas"
    }
  }
}
```

#### **3. Actualizar Datos de Scout**
```sql
actualizar_datos_scout(
  p_scout_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT actualizar_datos_scout(
  p_scout_id := '123e4567-e89b-12d3-a456-426614174000',
  p_datos_actualizacion := '{
    "datos_contacto": {
      "telefono": "999888777",
      "email": "juan.nuevo@email.com"
    },
    "estado": "ACTIVO"
  }'::json
);
```

#### **4. Cambiar Rama de Scout**
```sql
cambiar_rama_scout(
  p_scout_id UUID,
  p_nueva_rama rama_enum,
  p_motivo TEXT DEFAULT NULL
) RETURNS JSON
```

**Validaciones automáticas:**
- Verifica edad apropiada para la nueva rama
- Registra el cambio en el historial
- Actualiza automáticamente la patrulla si es necesario

---

### **🔍 BÚSQUEDA Y CONSULTA**

#### **5. Buscar Scouts por Criterio**
```sql
buscar_scouts_por_criterio(
  p_filtros JSON DEFAULT '{}',
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

**Filtros Disponibles:**
```json
{
  "rama": "LOBATOS",                    // Filtrar por rama
  "estado": "ACTIVO",                   // Estado del scout
  "patrulla_id": "uuid",               // Filtrar por patrulla
  "texto_busqueda": "Juan",            // Búsqueda en nombre/apellidos
  "edad_minima": 8,                    // Edad mínima
  "edad_maxima": 15,                   // Edad máxima
  "fecha_registro_desde": "2024-01-01", // Registrados desde
  "fecha_registro_hasta": "2024-12-31"  // Registrados hasta
}
```

**Ejemplo:**
```sql
SELECT buscar_scouts_por_criterio(
  p_filtros := '{
    "rama": "LOBATOS",
    "estado": "ACTIVO",
    "texto_busqueda": "García"
  }'::json,
  p_limite := 20,
  p_offset := 0
);
```

#### **6. Obtener Scouts por Patrulla**
```sql
obtener_scouts_por_patrulla(p_patrulla_id UUID) RETURNS JSON
```

#### **7. Obtener Scouts por Rama**
```sql
obtener_scouts_por_rama(p_rama rama_enum) RETURNS JSON
```

---

### **👨‍👩‍👧‍👦 GESTIÓN FAMILIAR**

#### **8. Actualizar Datos Familiares**
```sql
actualizar_datos_familiares(
  p_scout_id UUID,
  p_datos_familia JSON
) RETURNS JSON
```

**Estructura de datos_familia:**
```json
{
  "padre": {
    "nombre": "Carlos Pérez",
    "telefono": "987654321",
    "email": "carlos@email.com",
    "ocupacion": "Ingeniero"
  },
  "madre": {
    "nombre": "María García",
    "telefono": "987654322",
    "email": "maria@email.com",
    "ocupacion": "Doctora"
  },
  "contacto_emergencia": {
    "nombre": "Abuela Rosa",
    "telefono": "987654323",
    "relacion": "Abuela"
  },
  "autorizaciones": {
    "salidas": true,
    "medicamentos": false,
    "fotos": true
  }
}
```

#### **9. Obtener Historial Familiar**
```sql
obtener_historial_familiar(p_scout_id UUID) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS Y REPORTES**

#### **10. Estadísticas Generales de Scouts**
```sql
obtener_estadisticas_scouts() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_scouts": 120,
    "scouts_activos": 115,
    "scouts_inactivos": 5,
    "por_rama": {
      "CASTORES": 15,
      "LOBATOS": 25,
      "SCOUTS": 35,
      "VENTURES": 25,
      "ROVERS": 15
    },
    "por_genero": {
      "masculino": 60,
      "femenino": 55
    },
    "edad_promedio": 12.5,
    "nuevos_este_mes": 8
  }
}
```

#### **11. Estadísticas por Rama**
```sql
obtener_estadisticas_por_rama(p_rama rama_enum) RETURNS JSON
```

#### **12. Scouts Próximos a Cambio de Rama**
```sql
obtener_scouts_proximos_cambio_rama() RETURNS JSON
```

**Detecta automáticamente scouts que por edad deberían cambiar de rama.**

#### **13. Reporte de Cumpleaños**
```sql
obtener_cumpleanos_scouts(
  p_mes INTEGER DEFAULT NULL,
  p_dias_adelanto INTEGER DEFAULT 7
) RETURNS JSON
```

---

### **📈 PROGRESIÓN Y DESARROLLO**

#### **14. Registrar Progresión**
```sql
registrar_progresion_scout(
  p_scout_id UUID,
  p_tipo_progresion VARCHAR(100),
  p_detalle JSON,
  p_dirigente_evaluador UUID
) RETURNS JSON
```

**Tipos de progresión:**
- `ESPECIALIDAD` - Especialidades obtenidas
- `INSIGNIA` - Insignias de progresión
- `CARGO` - Cargos en patrulla/tropa
- `ACTIVIDAD_ESPECIAL` - Participación en actividades destacadas

#### **15. Obtener Progresión Scout**
```sql
obtener_progresion_scout(p_scout_id UUID) RETURNS JSON
```

#### **16. Actualizar Estado de Progresión**
```sql
actualizar_estado_progresion(
  p_scout_id UUID,
  p_progresion_id UUID,
  p_nuevo_estado VARCHAR(50)
) RETURNS JSON
```

---

### **🔄 GESTIÓN DE ESTADO**

#### **17. Activar Scout**
```sql
activar_scout(
  p_scout_id UUID,
  p_motivo TEXT DEFAULT NULL
) RETURNS JSON
```

#### **18. Desactivar Scout**
```sql
desactivar_scout(
  p_scout_id UUID,
  p_motivo TEXT,
  p_fecha_desactivacion DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

#### **19. Obtener Historial de Estados**
```sql
obtener_historial_estados_scout(p_scout_id UUID) RETURNS JSON
```

---

### **📝 DOCUMENTOS Y EXPEDIENTE**

#### **20. Registrar Documento**
```sql
registrar_documento_scout(
  p_scout_id UUID,
  p_tipo_documento VARCHAR(100),
  p_url_documento TEXT,
  p_metadata JSON DEFAULT '{}'
) RETURNS JSON
```

**Tipos de documento:**
- `FICHA_MEDICA`
- `AUTORIZACION_PADRES`
- `FOTO_CARNET`
- `CERTIFICADO_NACIMIENTO`
- `CONSTANCIA_ESTUDIOS`

#### **21. Obtener Documentos Scout**
```sql
obtener_documentos_scout(p_scout_id UUID) RETURNS JSON
```

#### **22. Validar Expediente Completo**
```sql
validar_expediente_scout(p_scout_id UUID) RETURNS JSON
```

---

### **🔍 BÚSQUEDAS AVANZADAS**

#### **23. Búsqueda por Texto Completo**
```sql
buscar_scouts_texto_completo(
  p_texto_busqueda TEXT,
  p_limite INTEGER DEFAULT 20
) RETURNS JSON
```

**Busca en:** nombre, apellidos, número de scout, datos de contacto, familia.

#### **24. Scouts sin Actividad Reciente**
```sql
obtener_scouts_sin_actividad(
  p_dias_inactividad INTEGER DEFAULT 30
) RETURNS JSON
```

#### **25. Scouts con Documentación Pendiente**
```sql
obtener_scouts_documentacion_pendiente() RETURNS JSON
```

---

### **📞 CONTACTO Y COMUNICACIÓN**

#### **26. Obtener Contactos de Emergencia**
```sql
obtener_contactos_emergencia(p_scout_id UUID) RETURNS JSON
```

#### **27. Obtener Lista de Comunicación**
```sql
obtener_lista_comunicacion_rama(p_rama rama_enum) RETURNS JSON
```

**Genera lista con emails y teléfonos de padres para comunicaciones masivas.**

---

### **🔄 MIGRACIÓN Y MANTENIMIENTO**

#### **28. Migrar Scout a Nueva Rama**
```sql
migrar_scout_nueva_rama(
  p_scout_id UUID,
  p_nueva_rama rama_enum,
  p_fecha_migracion DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

**Proceso completo de migración:**
- Valida edad apropiada
- Actualiza datos de progresión
- Reasigna patrulla automáticamente
- Registra en historial

#### **29. Limpiar Datos Históricos**
```sql
limpiar_datos_historicos_scout(
  p_scout_id UUID,
  p_conservar_meses INTEGER DEFAULT 24
) RETURNS JSON
```

#### **30. Exportar Datos Scout**
```sql
exportar_datos_scout(
  p_scout_id UUID,
  p_incluir_historiales BOOLEAN DEFAULT true
) RETURNS JSON
```

---

## 🔒 **Seguridad y Validaciones**

### **Validaciones Automáticas:**
- ✅ **Edad coherente con rama** - Verifica rangos de edad apropiados
- ✅ **Documentos requeridos** - Valida documentación mínima según edad
- ✅ **Datos familiares obligatorios** - Para menores de edad
- ✅ **Número de scout único** - Evita duplicados
- ✅ **Estados válidos** - Transiciones de estado controladas

### **Permisos por Rol:**
```sql
-- Dirigentes: Acceso completo a su rama
-- Coordinadores: Acceso completo al grupo
-- Padres: Solo datos de sus hijos
-- Scouts: Solo sus propios datos básicos
```

---

## 📊 **Performance y Optimización**

### **Índices Aplicados:**
- `idx_scouts_rama_estado` - Consultas por rama y estado
- `idx_scouts_numero` - Búsqueda por número de scout
- `idx_scouts_nombre_apellidos_gin` - Búsqueda de texto completo
- `idx_scouts_fecha_nacimiento` - Cálculos de edad y cambios de rama

### **Cache Inteligente:**
```sql
-- Estadísticas con cache automático (2 horas)
SELECT obtener_estadisticas_scouts_cached();

-- Búsquedas frecuentes con cache (30 minutos)
SELECT buscar_scouts_cached(filtros);
```

---

## 🧪 **Testing y Validación**

### **Ejecutar Validaciones:**
```sql
-- Validar todas las funciones del módulo
SELECT validar_functions_scouts();

-- Test específico de registro
SELECT test_registrar_scout();

-- Test de búsquedas
SELECT test_buscar_scouts();
```

### **Datos de Prueba:**
```sql
-- Generar datos de prueba
SELECT generar_datos_prueba_scouts(cantidad := 50);

-- Limpiar datos de prueba
SELECT limpiar_datos_prueba_scouts();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo React/TypeScript:**
```typescript
interface Scout {
  id: string;
  numeroScout: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  rama: Rama;
  estado: EstadoScout;
  datosContacto: ContactoScout;
  datosFamilia: FamiliaScout;
}

// Servicio de integración
export class ScoutService {
  async registrarScout(datos: RegistroScoutData): Promise<Scout> {
    const { data, error } = await supabase.rpc('registrar_scout', datos);
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  }
  
  async buscarScouts(filtros: FiltrosScout): Promise<Scout[]> {
    const { data } = await supabase.rpc('buscar_scouts_por_criterio', {
      p_filtros: filtros,
      p_limite: 50
    });
    
    return data.success ? data.data : [];
  }
}
```

---

**📈 Total: 30 funciones implementadas para gestión completa de scouts**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**