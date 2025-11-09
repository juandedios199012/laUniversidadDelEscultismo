# 📋 Inscripción API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Inscripción gestiona el proceso anual de inscripciones, renovaciones, documentación requerida y validación de requisitos. Contiene **~10 funciones** especializadas en el proceso de inscripción anual.

**Archivo:** `database/14_functions_inscripcion.sql`

---

## 🔧 **Funciones Principales**

### **📝 PROCESO DE INSCRIPCIÓN**

#### **1. Iniciar Proceso de Inscripción**
```sql
iniciar_proceso_inscripcion(
  p_scout_id UUID DEFAULT NULL,
  p_tipo_inscripcion tipo_inscripcion_enum,
  p_ano_inscripcion INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_rama_objetivo rama_enum DEFAULT NULL,
  p_datos_personales JSON DEFAULT '{}',
  p_datos_contacto JSON DEFAULT '{}',
  p_datos_familia JSON DEFAULT '{}',
  p_responsable_proceso_id UUID
) RETURNS JSON
```

**Tipos de inscripción:**
- `NUEVO_SCOUT` - Inscripción de scout nuevo
- `RENOVACION` - Renovación anual de scout existente
- `CAMBIO_RAMA` - Cambio de rama por edad
- `REINGRESO` - Reingreso de scout que estuvo inactivo
- `TRANSFERENCIA` - Transferencia desde otro grupo

**Ejemplo:**
```sql
SELECT iniciar_proceso_inscripcion(
  p_scout_id := NULL, -- Nuevo scout
  p_tipo_inscripcion := 'NUEVO_SCOUT',
  p_ano_inscripcion := 2025,
  p_rama_objetivo := 'LOBATOS',
  p_datos_personales := '{
    "nombre": "Diego",
    "apellidos": "Martínez López",
    "fecha_nacimiento": "2013-08-15",
    "lugar_nacimiento": "Lima, Perú",
    "nacionalidad": "Peruana",
    "documento_identidad": "12345678",
    "tipo_documento": "DNI"
  }'::json,
  p_datos_contacto := '{
    "direccion": "Av. Universitaria 1245, San Miguel",
    "telefono": "987654321",
    "email": "diego.martinez@email.com",
    "distrito": "San Miguel",
    "referencia": "Frente al parque central"
  }'::json,
  p_datos_familia := '{
    "padre": {
      "nombre": "Roberto Martínez",
      "telefono": "987123456",
      "email": "roberto.martinez@email.com",
      "ocupacion": "Ingeniero"
    },
    "madre": {
      "nombre": "Carmen López",
      "telefono": "987123457", 
      "email": "carmen.lopez@email.com",
      "ocupacion": "Profesora"
    },
    "contacto_emergencia": {
      "nombre": "Abuela María",
      "telefono": "987123458",
      "relacion": "Abuela materna"
    }
  }'::json,
  p_responsable_proceso_id := 'dir123-456-789'
);
```

#### **2. Actualizar Datos de Inscripción**
```sql
actualizar_datos_inscripcion(
  p_inscripcion_id UUID,
  p_seccion_datos VARCHAR(50),
  p_nuevos_datos JSON
) RETURNS JSON
```

**Secciones de datos:**
- `DATOS_PERSONALES` - Información personal del scout
- `DATOS_CONTACTO` - Información de contacto
- `DATOS_FAMILIA` - Información familiar
- `DATOS_MEDICOS` - Información médica
- `AUTORIZACIONES` - Autorizaciones y permisos
- `OBSERVACIONES` - Observaciones especiales

#### **3. Obtener Estado de Inscripción**
```sql
obtener_estado_inscripcion(p_inscripcion_id UUID) RETURNS JSON
```

---

### **📄 GESTIÓN DE DOCUMENTOS**

#### **4. Registrar Documento de Inscripción**
```sql
registrar_documento_inscripcion(
  p_inscripcion_id UUID,
  p_tipo_documento tipo_documento_inscripcion_enum,
  p_nombre_archivo VARCHAR(200),
  p_url_documento TEXT,
  p_fecha_expedicion DATE DEFAULT NULL,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL,
  p_validado BOOLEAN DEFAULT false
) RETURNS JSON
```

**Tipos de documento requeridos:**
- `FICHA_INSCRIPCION` - Ficha de inscripción completa
- `CERTIFICADO_NACIMIENTO` - Certificado de nacimiento
- `FOTO_CARNET` - Fotografía tamaño carnet
- `FICHA_MEDICA` - Ficha médica actualizada
- `AUTORIZACION_PADRES` - Autorización firmada por padres
- `CONSTANCIA_ESTUDIOS` - Constancia de estudios actual
- `COPIA_DNI` - Copia del DNI (menores con DNI)
- `SEGURO_MEDICO` - Constancia de seguro médico
- `CERTIFICADO_VACUNAS` - Certificado de vacunas (según edad)
- `AUTORIZACION_FOTOS` - Autorización para uso de fotografías

#### **5. Validar Documentación**
```sql
validar_documentacion_inscripcion(
  p_inscripcion_id UUID,
  p_validador_id UUID,
  p_observaciones_validacion TEXT DEFAULT NULL
) RETURNS JSON
```

#### **6. Obtener Documentos Faltantes**
```sql
obtener_documentos_faltantes(p_inscripcion_id UUID) RETURNS JSON
```

---

### **💰 GESTIÓN DE PAGOS**

#### **7. Registrar Pago de Inscripción**
```sql
registrar_pago_inscripcion(
  p_inscripcion_id UUID,
  p_concepto_pago VARCHAR(200),
  p_monto DECIMAL(10,2),
  p_metodo_pago metodo_pago_enum,
  p_fecha_pago DATE DEFAULT CURRENT_DATE,
  p_numero_comprobante VARCHAR(50) DEFAULT NULL,
  p_observaciones_pago TEXT DEFAULT NULL,
  p_registrado_por_id UUID
) RETURNS JSON
```

**Conceptos de pago comunes:**
- `INSCRIPCION_ANUAL` - Inscripción anual
- `UNIFORME` - Costo de uniforme
- `MANUAL_RAMA` - Manual de la rama
- `INSIGNIAS` - Insignias y distintivos
- `SEGURO_SCOUT` - Seguro scout anual
- `ACTIVIDADES_ESPECIALES` - Actividades especiales del año
- `MATERIAL_EDUCATIVO` - Material educativo

**Ejemplo:**
```sql
SELECT registrar_pago_inscripcion(
  p_inscripcion_id := 'insc123-456-789',
  p_concepto_pago := 'Inscripción Anual 2025 - Lobatos',
  p_monto := 180.00,
  p_metodo_pago := 'TRANSFERENCIA',
  p_fecha_pago := '2024-11-15',
  p_numero_comprobante := 'TRF001234567',
  p_observaciones_pago := 'Pago completo de inscripción anual',
  p_registrado_por_id := 'dir123-456-789'
);
```

---

### **✅ FINALIZACIÓN Y APROBACIÓN**

#### **8. Aprobar Inscripción**
```sql
aprobar_inscripcion(
  p_inscripcion_id UUID,
  p_aprobador_id UUID,
  p_observaciones_aprobacion TEXT DEFAULT NULL,
  p_fecha_aprobacion DATE DEFAULT CURRENT_DATE,
  p_numero_scout_asignado VARCHAR(20) DEFAULT NULL
) RETURNS JSON
```

#### **9. Obtener Inscripciones Pendientes**
```sql
obtener_inscripciones_pendientes(
  p_rama rama_enum DEFAULT NULL,
  p_tipo_pendencia VARCHAR(50) DEFAULT NULL,
  p_fecha_limite DATE DEFAULT NULL
) RETURNS JSON
```

**Tipos de pendencia:**
- `DOCUMENTOS_FALTANTES` - Faltan documentos
- `PAGO_PENDIENTE` - Pago no completado
- `VALIDACION_MEDICA` - Pendiente validación médica
- `APROBACION_DIRIGENTE` - Pendiente aprobación de dirigente
- `ASIGNACION_PATRULLA` - Pendiente asignación a patrulla

---

### **📊 REPORTES Y ESTADÍSTICAS**

#### **10. Generar Reporte de Inscripciones**
```sql
generar_reporte_inscripciones(
  p_ano_inscripcion INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_rama rama_enum DEFAULT NULL,
  p_incluir_estadisticas BOOLEAN DEFAULT true
) RETURNS JSON
```

**Respuesta del reporte:**
```json
{
  "success": true,
  "data": {
    "resumen_general": {
      "ano_inscripcion": 2025,
      "total_inscripciones": 125,
      "inscripciones_aprobadas": 110,
      "inscripciones_pendientes": 15,
      "nuevos_scouts": 25,
      "renovaciones": 85,
      "cambios_rama": 15
    },
    "por_rama": {
      "CASTORES": {"nuevos": 8, "renovaciones": 12, "total": 20},
      "LOBATOS": {"nuevos": 6, "renovaciones": 24, "total": 30},
      "SCOUTS": {"nuevos": 4, "renovaciones": 31, "total": 35},
      "VENTURES": {"nuevos": 4, "renovaciones": 21, "total": 25},
      "ROVERS": {"nuevos": 3, "renovaciones": 12, "total": 15}
    },
    "estado_documentacion": {
      "completa": 95,
      "incompleta": 20,
      "pendiente_validacion": 10
    },
    "estado_pagos": {
      "pagos_completos": 105,
      "pagos_pendientes": 15,
      "pagos_parciales": 5
    },
    "timeline_inscripciones": {
      "enero": 15,
      "febrero": 35,
      "marzo": 45,
      "octubre": 20,
      "noviembre": 10
    }
  }
}
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Edad apropiada para rama** - Verificar edad según rama objetivo
- ✅ **Documentos obligatorios** - Validar documentos requeridos por edad
- ✅ **Información familiar completa** - Para menores de edad
- ✅ **Pagos requeridos** - Validar pagos según concepto
- ✅ **No duplicación** - Evitar inscripciones duplicadas

### **Reglas de Inscripción:**
```sql
-- Inscripciones abren en enero y cierran en marzo (periodo principal)
-- Inscripciones tardías aceptadas hasta noviembre con recargo
-- Cambios de rama automáticos por edad en enero
-- Documentación médica no mayor a 6 meses
-- Autorización de padres obligatoria para menores de 18 años
```

---

## 📅 **Calendario de Inscripciones**

### **Período Principal (Enero - Marzo):**
```sql
-- Apertura de inscripciones: 15 de enero
-- Promoción intensiva: febrero
-- Cierre período principal: 31 de marzo
-- Descuentos por pronto pago disponibles
```

### **Período Tardío (Abril - Noviembre):**
```sql
-- Inscripciones con recargo del 20%
-- Evaluación individual de casos
-- Integración gradual a actividades
-- Documentación expedita requerida
```

---

## 📊 **Dashboard de Inscripciones**

### **KPIs del Proceso:**
```sql
-- Métricas de inscripción
SELECT obtener_kpis_inscripciones();

-- Resultado esperado:
{
  "tasa_conversion": 89.5,          // % de procesos iniciados vs completados
  "tiempo_promedio_proceso_dias": 12,   // Días promedio de proceso
  "satisfaccion_proceso": 4.4,      // Calificación del proceso
  "documentos_rechazados_pct": 8.2,     // % de documentos rechazados
  "pagos_tiempo_promedio_dias": 5,      // Días promedio para pago
  "inscripciones_objetivo_cumplimiento": 98.5  // % de objetivo anual
}
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_inscripcion();

-- Simular proceso completo de inscripción
SELECT test_proceso_inscripcion_completo();

-- Test de validaciones
SELECT test_validaciones_inscripcion();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Inscripcion {
  id: string;
  scoutId?: string;
  tipoInscripcion: TipoInscripcion;
  anoInscripcion: number;
  ramaObjetivo: Rama;
  datosPersonales: DatosPersonales;
  datosContacto: DatosContacto;
  datosFamilia: DatosFamilia;
  documentos: DocumentoInscripcion[];
  pagos: PagoInscripcion[];
  estado: EstadoInscripcion;
  fechaCreacion: string;
}

export class InscripcionService {
  static async iniciarProceso(inscripcion: IniciarInscripcionData): Promise<Inscripcion> {
    const response = await DatabaseFunctions.callFunction('iniciar_proceso_inscripcion', {
      p_scout_id: inscripcion.scoutId,
      p_tipo_inscripcion: inscripcion.tipoInscripcion,
      p_ano_inscripcion: inscripcion.anoInscripcion,
      p_rama_objetivo: inscripcion.ramaObjetivo,
      p_datos_personales: inscripcion.datosPersonales,
      p_datos_contacto: inscripcion.datosContacto,
      p_datos_familia: inscripcion.datosFamilia,
      p_responsable_proceso_id: inscripcion.responsableProcesoId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async registrarDocumento(documento: RegistroDocumentoData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('registrar_documento_inscripcion', {
      p_inscripcion_id: documento.inscripcionId,
      p_tipo_documento: documento.tipoDocumento,
      p_nombre_archivo: documento.nombreArchivo,
      p_url_documento: documento.urlDocumento,
      p_fecha_expedicion: documento.fechaExpedicion,
      p_fecha_vencimiento: documento.fechaVencimiento
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
  
  static async registrarPago(pago: RegistroPagoData): Promise<void> {
    const response = await DatabaseFunctions.callFunction('registrar_pago_inscripcion', {
      p_inscripcion_id: pago.inscripcionId,
      p_concepto_pago: pago.concepto,
      p_monto: pago.monto,
      p_metodo_pago: pago.metodoPago,
      p_numero_comprobante: pago.numeroComprobante,
      p_registrado_por_id: pago.registradoPorId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Inscripción de Scout Nuevo:**
```sql
-- 1. Iniciar proceso
SELECT iniciar_proceso_inscripcion(
  NULL, 'NUEVO_SCOUT', 2025, 'LOBATOS', datos_personales, datos_contacto, datos_familia
);

-- 2. Subir documentos requeridos
SELECT registrar_documento_inscripcion(inscripcion_id, 'FICHA_INSCRIPCION', 'ficha.pdf', url);
SELECT registrar_documento_inscripcion(inscripcion_id, 'CERTIFICADO_NACIMIENTO', 'cert.pdf', url);

-- 3. Registrar pago
SELECT registrar_pago_inscripcion(inscripcion_id, 'INSCRIPCION_ANUAL', 180.00, 'TRANSFERENCIA');

-- 4. Validar documentación
SELECT validar_documentacion_inscripcion(inscripcion_id, validador_id);

-- 5. Aprobar inscripción
SELECT aprobar_inscripcion(inscripcion_id, aprobador_id);
```

### **2. Renovación Anual:**
```sql
-- 1. Iniciar renovación
SELECT iniciar_proceso_inscripcion(
  scout_id, 'RENOVACION', 2025, rama_actual, datos_actualizados
);

-- 2. Actualizar información si es necesario
SELECT actualizar_datos_inscripcion(inscripcion_id, 'DATOS_CONTACTO', nuevos_datos);

-- 3. Verificar documentos vigentes
SELECT obtener_documentos_faltantes(inscripcion_id);

-- 4. Proceso de pago y aprobación
```

### **3. Gestión Masiva de Inscripciones:**
```sql
-- Obtener inscripciones pendientes
SELECT obtener_inscripciones_pendientes('LOBATOS', 'DOCUMENTOS_FALTANTES');

-- Generar reporte de estado
SELECT generar_reporte_inscripciones(2025, NULL, true);

-- Identificar casos que requieren seguimiento
SELECT obtener_inscripciones_pendientes(NULL, 'PAGO_PENDIENTE', CURRENT_DATE + INTERVAL '7 days');
```

---

**📈 Total: 10 funciones implementadas para gestión completa de inscripciones**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**