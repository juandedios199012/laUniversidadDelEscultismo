# 💰 Presupuestos API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Presupuestos gestiona toda la administración financiera del grupo scout, incluyendo ingresos, gastos, presupuestos anuales, análisis de rentabilidad y control financiero. Contiene **~20 funciones** para la gestión completa de las finanzas.

**Archivo:** `database/07_functions_presupuestos.sql`

---

## 🔧 **Funciones Principales**

### **📊 GESTIÓN DE PRESUPUESTOS**

#### **1. Crear Presupuesto Anual**
```sql
crear_presupuesto_anual(
  p_ano INTEGER,
  p_ingresos_estimados DECIMAL(12,2),
  p_gastos_estimados DECIMAL(12,2),
  p_detalle_presupuesto JSON,
  p_responsable_id UUID
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT crear_presupuesto_anual(
  p_ano := 2025,
  p_ingresos_estimados := 50000.00,
  p_gastos_estimados := 45000.00,
  p_detalle_presupuesto := '{
    "ingresos": {
      "cuotas_scouts": 30000.00,
      "actividades": 15000.00,
      "donaciones": 5000.00
    },
    "gastos": {
      "materiales": 20000.00,
      "actividades": 15000.00,
      "mantenimiento": 10000.00
    }
  }'::json,
  p_responsable_id := 'coord123-456-789'
);
```

#### **2. Actualizar Presupuesto**
```sql
actualizar_presupuesto(
  p_presupuesto_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **3. Obtener Presupuesto por Año**
```sql
obtener_presupuesto_por_ano(p_ano INTEGER) RETURNS JSON
```

---

### **💸 GESTIÓN DE GASTOS**

#### **4. Registrar Gasto**
```sql
registrar_gasto(
  p_concepto VARCHAR(200),
  p_monto DECIMAL(10,2),
  p_categoria categoria_gasto_enum,
  p_fecha_gasto DATE DEFAULT CURRENT_DATE,
  p_proveedor VARCHAR(150) DEFAULT NULL,
  p_actividad_id UUID DEFAULT NULL,
  p_responsable_id UUID,
  p_comprobante_url TEXT DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Categorías de gastos:**
- `MATERIALES` - Compra de materiales y equipos
- `ACTIVIDADES` - Gastos directos de actividades
- `TRANSPORTE` - Gastos de movilidad
- `ALIMENTACION` - Gastos de comida en actividades
- `SERVICIOS` - Servicios básicos (luz, agua, internet)
- `MANTENIMIENTO` - Mantenimiento de instalaciones
- `ADMINISTRATIVO` - Gastos administrativos
- `OTROS` - Otros gastos no categorizados

**Ejemplo:**
```sql
SELECT registrar_gasto(
  p_concepto := 'Compra de carpas para campamento',
  p_monto := 2250.00,
  p_categoria := 'MATERIALES',
  p_fecha_gasto := '2024-10-20',
  p_proveedor := 'Tienda Scout SAC',
  p_actividad_id := 'camp123-456-789',
  p_responsable_id := 'coord123-456-789',
  p_comprobante_url := 'https://storage/comprobantes/gasto_001.pdf',
  p_observaciones := 'Carpas para 20 scouts - Campamento de invierno'
);
```

#### **5. Actualizar Gasto**
```sql
actualizar_gasto(
  p_gasto_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **6. Anular Gasto**
```sql
anular_gasto(
  p_gasto_id UUID,
  p_motivo_anulacion TEXT
) RETURNS JSON
```

---

### **💰 GESTIÓN DE INGRESOS**

#### **7. Registrar Ingreso**
```sql
registrar_ingreso(
  p_concepto VARCHAR(200),
  p_monto DECIMAL(10,2),
  p_categoria categoria_ingreso_enum,
  p_fecha_ingreso DATE DEFAULT CURRENT_DATE,
  p_scout_id UUID DEFAULT NULL,
  p_actividad_id UUID DEFAULT NULL,
  p_metodo_pago metodo_pago_enum DEFAULT 'EFECTIVO',
  p_comprobante_numero VARCHAR(50) DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Categorías de ingresos:**
- `CUOTA_MENSUAL` - Cuotas mensuales de scouts
- `INSCRIPCION_ANUAL` - Inscripciones anuales
- `ACTIVIDAD` - Pagos por actividades específicas
- `DONACION` - Donaciones recibidas
- `VENTA` - Ventas de productos
- `SUBVENCION` - Subvenciones o apoyos externos
- `OTROS` - Otros ingresos

**Métodos de pago:**
- `EFECTIVO` - Pago en efectivo
- `TRANSFERENCIA` - Transferencia bancaria
- `YAPE` - Pago por Yape
- `PLIN` - Pago por Plin
- `TARJETA` - Pago con tarjeta

#### **8. Procesar Pago de Cuota**
```sql
procesar_pago_cuota(
  p_scout_id UUID,
  p_monto DECIMAL(10,2),
  p_mes INTEGER,
  p_ano INTEGER,
  p_metodo_pago metodo_pago_enum DEFAULT 'EFECTIVO',
  p_comprobante_numero VARCHAR(50) DEFAULT NULL
) RETURNS JSON
```

#### **9. Obtener Estado de Pagos Scout**
```sql
obtener_estado_pagos_scout(
  p_scout_id UUID,
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

---

### **📊 ANÁLISIS FINANCIERO**

#### **10. Estado Financiero Mensual**
```sql
obtener_estado_financiero_mensual(
  p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "periodo": "2024-10",
    "resumen": {
      "total_ingresos": 4500.00,
      "total_gastos": 3200.00,
      "balance": 1300.00,
      "porcentaje_ejecucion_presupuesto": 75.5
    },
    "ingresos_por_categoria": {
      "CUOTA_MENSUAL": 3000.00,
      "ACTIVIDAD": 1200.00,
      "DONACION": 300.00
    },
    "gastos_por_categoria": {
      "MATERIALES": 1500.00,
      "ACTIVIDADES": 1200.00,
      "SERVICIOS": 500.00
    },
    "comparacion_presupuesto": {
      "ingresos_vs_presupuesto": 90.0,
      "gastos_vs_presupuesto": 85.3
    }
  }
}
```

#### **11. Análisis de Flujo de Caja**
```sql
analizar_flujo_caja(
  p_fecha_desde DATE,
  p_fecha_hasta DATE
) RETURNS JSON
```

#### **12. Proyección Financiera**
```sql
generar_proyeccion_financiera(
  p_meses_proyeccion INTEGER DEFAULT 6,
  p_escenario VARCHAR(20) DEFAULT 'CONSERVADOR'
) RETURNS JSON
```

---

### **📈 CONTROL PRESUPUESTARIO**

#### **13. Verificar Disponibilidad Presupuestaria**
```sql
verificar_disponibilidad_presupuestaria(
  p_categoria categoria_gasto_enum,
  p_monto DECIMAL(10,2),
  p_actividad_id UUID DEFAULT NULL
) RETURNS JSON
```

#### **14. Obtener Alertas Presupuestarias**
```sql
obtener_alertas_presupuestarias() RETURNS JSON
```

**Tipos de alertas:**
- Categorías que exceden el 90% del presupuesto
- Gastos sin comprobantes
- Pagos de cuotas atrasados
- Proyecciones de déficit

#### **15. Comparativo Presupuesto vs Ejecutado**
```sql
comparar_presupuesto_ejecutado(
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_categoria categoria_gasto_enum DEFAULT NULL
) RETURNS JSON
```

---

### **📋 REPORTES FINANCIEROS**

#### **16. Reporte de Morosidad**
```sql
generar_reporte_morosidad(
  p_meses_atraso INTEGER DEFAULT 2
) RETURNS JSON
```

#### **17. Análisis de Rentabilidad por Actividad**
```sql
analizar_rentabilidad_actividad(
  p_actividad_id UUID DEFAULT NULL,
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '6 months'
) RETURNS JSON
```

#### **18. Reporte de Proveedores**
```sql
generar_reporte_proveedores(
  p_fecha_desde DATE,
  p_fecha_hasta DATE
) RETURNS JSON
```

---

### **💳 GESTIÓN DE PAGOS**

#### **19. Programar Pago Recurrente**
```sql
programar_pago_recurrente(
  p_concepto VARCHAR(200),
  p_monto DECIMAL(10,2),
  p_categoria categoria_gasto_enum,
  p_frecuencia VARCHAR(20),
  p_fecha_inicio DATE,
  p_proveedor VARCHAR(150) DEFAULT NULL
) RETURNS JSON
```

#### **20. Procesar Pagos Pendientes**
```sql
procesar_pagos_pendientes() RETURNS JSON
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Disponibilidad presupuestaria** - No permitir gastos que excedan presupuesto
- ✅ **Comprobantes obligatorios** - Gastos >S/100 requieren comprobante
- ✅ **Fechas coherentes** - No permitir fechas futuras en gastos
- ✅ **Categorización correcta** - Validar que gastos estén en categoría apropiada
- ✅ **Límites de aprobación** - Gastos >S/500 requieren aprobación adicional

### **Triggers Automáticos:**
```sql
-- Actualización automática de saldos
-- Alertas por exceso de presupuesto
-- Registro de auditoría financiera
-- Cálculo automático de proyecciones
```

---

## 📊 **Dashboards y KPIs**

### **KPIs Financieros Principales:**
```sql
-- Métricas en tiempo real
SELECT obtener_kpis_financieros();

-- Resultado esperado:
{
  "balance_actual": 15750.00,
  "porcentaje_ejecucion_presupuesto": 78.5,
  "ingresos_mes_actual": 4500.00,
  "gastos_mes_actual": 3200.00,
  "proyeccion_fin_ano": 8500.00,
  "scouts_con_pagos_al_dia": 85.2,
  "alertas_presupuestarias": 2
}
```

### **Gráficos Recomendados:**
- 📊 **Gauge Charts** - Ejecución presupuestaria por categoría
- 📈 **Line Charts** - Evolución mensual de ingresos/gastos
- 🥧 **Pie Charts** - Distribución de gastos por categoría
- 💹 **Waterfall Charts** - Flujo de caja mensual

---

## 🔐 **Seguridad y Auditoría**

### **Permisos por Rol:**
```sql
-- COORDINADOR: Acceso completo
-- TESORERO: Gestión de ingresos/gastos, reportes
-- DIRIGENTE: Solo consulta de presupuestos de su rama
-- CONTADOR: Acceso a reportes y análisis
```

### **Auditoría Automática:**
```sql
-- Registro de todos los cambios financieros
-- Log de accesos a información sensible
-- Backup automático de transacciones
-- Verificación de integridad de datos
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_presupuestos();

-- Generar datos de prueba
SELECT generar_datos_prueba_presupuestos();

-- Test de cálculos financieros
SELECT test_calculos_financieros();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  categoria: CategoriaGasto;
  fechaGasto: string;
  proveedor?: string;
  responsableId: string;
  comprobanteUrl?: string;
}

export class PresupuestoService {
  static async registrarGasto(gasto: RegistroGastoData): Promise<Gasto> {
    const response = await DatabaseFunctions.callFunction('registrar_gasto', {
      p_concepto: gasto.concepto,
      p_monto: gasto.monto,
      p_categoria: gasto.categoria,
      p_fecha_gasto: gasto.fechaGasto,
      p_proveedor: gasto.proveedor,
      p_responsable_id: gasto.responsableId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async obtenerEstadoFinanciero(mes: number, ano: number): Promise<EstadoFinanciero> {
    const response = await DatabaseFunctions.callFunction('obtener_estado_financiero_mensual', {
      p_mes: mes,
      p_ano: ano
    });
    
    return response.success ? response.data : null;
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Registrar Gasto de Actividad:**
```sql
-- 1. Verificar disponibilidad presupuestaria
SELECT verificar_disponibilidad_presupuestaria('ACTIVIDADES', 1500.00);

-- 2. Registrar el gasto
SELECT registrar_gasto(
  'Materiales para campamento',
  1500.00,
  'ACTIVIDADES',
  CURRENT_DATE,
  'Proveedor Scout SAC'
);

-- 3. Verificar impacto en presupuesto
SELECT comparar_presupuesto_ejecutado(2024, 'ACTIVIDADES');
```

### **2. Procesar Pagos Mensuales:**
```sql
-- Registrar múltiples pagos de cuotas
SELECT procesar_pago_cuota(scout_id, 150.00, 10, 2024, 'TRANSFERENCIA')
FROM scouts WHERE estado = 'ACTIVO';

-- Generar reporte de cobranza
SELECT generar_reporte_morosidad(1);
```

### **3. Análisis Financiero Mensual:**
```sql
-- Estado financiero del mes
SELECT obtener_estado_financiero_mensual(10, 2024);

-- Alertas presupuestarias
SELECT obtener_alertas_presupuestarias();

-- Proyección próximos meses
SELECT generar_proyeccion_financiera(3, 'CONSERVADOR');
```

---

**📈 Total: 20 funciones implementadas para gestión financiera completa**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**