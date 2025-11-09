# 📊 Reportes API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Reportes genera analytics, estadísticas y reportes consolidados de todos los módulos del sistema. Contiene **~15 funciones** especializadas en business intelligence y dashboard para la toma de decisiones.

**Archivo:** `database/16_functions_reports.sql`

---

## 🔧 **Funciones Principales**

### **📊 REPORTES EJECUTIVOS**

#### **1. Dashboard Principal**
```sql
generar_dashboard_principal(
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

**Descripción:** Genera el dashboard principal con KPIs clave del grupo scout.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "fecha_desde": "2024-09-24",
      "fecha_hasta": "2024-10-24"
    },
    "kpis_principales": {
      "total_scouts_activos": 115,
      "porcentaje_asistencia_promedio": 87.5,
      "actividades_realizadas": 12,
      "ingresos_periodo": 15500.00,
      "gastos_periodo": 8750.00,
      "items_inventario_activos": 380,
      "prestamos_pendientes": 8
    },
    "tendencias": {
      "crecimiento_scouts": 8.5,
      "variacion_asistencia": 2.3,
      "eficiencia_financiera": 95.2
    },
    "alertas": [
      {
        "tipo": "WARNING",
        "modulo": "ASISTENCIA",
        "mensaje": "3 scouts con más de 4 faltas consecutivas"
      },
      {
        "tipo": "INFO",
        "modulo": "INVENTARIO", 
        "mensaje": "5 items próximos a mantenimiento"
      }
    ]
  }
}
```

#### **2. Reporte Ejecutivo Mensual**
```sql
generar_reporte_ejecutivo_mensual(
  p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

#### **3. Análisis de Tendencias Anuales**
```sql
analizar_tendencias_anuales(
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

**Incluye:**
- Evolución de membresía por rama
- Tendencias de participación
- Análisis financiero anual
- Progresión de scouts
- Utilización de recursos

---

### **👥 REPORTES DE PARTICIPACIÓN**

#### **4. Análisis de Participación por Scout**
```sql
analizar_participacion_scout(
  p_scout_id UUID DEFAULT NULL,
  p_rama rama_enum DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 6
) RETURNS JSON
```

**Métricas incluidas:**
- Porcentaje de asistencia
- Participación en actividades especiales
- Progresión en especialidades
- Contribución en patrulla
- Tendencia de participación

#### **5. Ranking de Participación**
```sql
generar_ranking_participacion(
  p_periodo_meses INTEGER DEFAULT 12,
  p_rama rama_enum DEFAULT NULL,
  p_tipo_ranking VARCHAR(50) DEFAULT 'GENERAL'
) RETURNS JSON
```

**Tipos de ranking:**
- `GENERAL` - Participación general
- `ASISTENCIA` - Mayor asistencia
- `ACTIVIDADES` - Participación en actividades
- `PROGRESION` - Avance en especialidades
- `LIDERAZGO` - Contribución al grupo

#### **6. Análisis de Retención**
```sql
analizar_retencion_scouts(
  p_periodo_anos INTEGER DEFAULT 3
) RETURNS JSON
```

---

### **💰 REPORTES FINANCIEROS**

#### **7. Estado Financiero Consolidado**
```sql
generar_estado_financiero(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_incluir_proyecciones BOOLEAN DEFAULT false
) RETURNS JSON
```

**Incluye:**
- Ingresos por categoría
- Gastos detallados
- Balance por actividad
- Flujo de caja
- Indicadores financieros

#### **8. Análisis de Rentabilidad por Actividad**
```sql
analizar_rentabilidad_actividades(
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

#### **9. Proyección Presupuestaria**
```sql
generar_proyeccion_presupuestaria(
  p_meses_proyeccion INTEGER DEFAULT 6,
  p_escenario VARCHAR(20) DEFAULT 'CONSERVADOR'
) RETURNS JSON
```

**Escenarios:**
- `OPTIMISTA` - Crecimiento del 15%
- `CONSERVADOR` - Crecimiento del 5%
- `PESIMISTA` - Sin crecimiento

---

### **📅 REPORTES DE ACTIVIDADES**

#### **10. Efectividad de Actividades**
```sql
analizar_efectividad_actividades(
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '1 year',
  p_tipo_actividad VARCHAR(100) DEFAULT NULL
) RETURNS JSON
```

**Métricas:**
- Nivel de participación
- Satisfacción promedio
- Costo por participante
- Impacto en progresión
- Repetibilidad de la actividad

#### **11. Calendario de Actividades Optimizado**
```sql
generar_calendario_optimizado(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_incluir_sugerencias BOOLEAN DEFAULT true
) RETURNS JSON
```

---

### **📈 REPORTES DE PROGRESIÓN**

#### **12. Análisis de Progresión por Rama**
```sql
analizar_progresion_por_rama(
  p_rama rama_enum DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 12
) RETURNS JSON
```

**Incluye:**
- Especialidades obtenidas
- Insignias de progresión
- Tiempo promedio de avance
- Scouts próximos a cambio de rama
- Identificación de rezagos

#### **13. Reporte de Reconocimientos**
```sql
generar_reporte_reconocimientos(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_tipo_reconocimiento VARCHAR(100) DEFAULT NULL
) RETURNS JSON
```

---

### **🏕️ REPORTES OPERATIVOS**

#### **14. Utilización de Recursos**
```sql
analizar_utilizacion_recursos(
  p_tipo_recurso VARCHAR(100) DEFAULT NULL,
  p_periodo_meses INTEGER DEFAULT 12
) RETURNS JSON
```

**Tipos de recurso:**
- `INVENTARIO` - Equipos y materiales
- `INSTALACIONES` - Uso de espacios
- `DIRIGENTES` - Carga de trabajo
- `PRESUPUESTO` - Eficiencia financiera

#### **15. Reporte de Mantenimiento y Operaciones**
```sql
generar_reporte_operaciones(
  p_fecha_desde DATE,
  p_fecha_hasta DATE
) RETURNS JSON
```

---

## 📊 **Reportes Especializados por Función**

### **Dashboard Interactivo:**
```sql
-- KPIs en tiempo real
SELECT obtener_kpis_tiempo_real();

-- Métricas de performance
SELECT obtener_metricas_performance();

-- Alertas y notificaciones
SELECT obtener_alertas_sistema();
```

### **Exportación de Datos:**
```sql
-- Exportar para Excel/CSV
SELECT exportar_datos_reporte(
  p_tipo_reporte := 'FINANCIERO',
  p_formato := 'CSV',
  p_filtros := '{"fecha_desde": "2024-01-01"}'::json
);
```

### **Reportes Automatizados:**
```sql
-- Programar envío automático
SELECT programar_reporte_automatico(
  p_tipo_reporte := 'EJECUTIVO_MENSUAL',
  p_destinatarios := '["coordinador@grupo.com", "tesorero@grupo.com"]',
  p_frecuencia := 'MENSUAL'
);
```

---

## 🎯 **Casos de Uso por Rol**

### **👑 Coordinador General:**
```sql
-- Dashboard ejecutivo completo
SELECT generar_dashboard_principal();

-- Estado financiero consolidado
SELECT generar_estado_financiero(
  '2024-01-01', CURRENT_DATE, true
);

-- Análisis de tendencias
SELECT analizar_tendencias_anuales(2024);
```

### **💰 Tesorero:**
```sql
-- Estado financiero detallado
SELECT generar_estado_financiero('2024-10-01', '2024-10-31');

-- Proyecciones presupuestarias
SELECT generar_proyeccion_presupuestaria(6, 'CONSERVADOR');

-- Análisis de rentabilidad
SELECT analizar_rentabilidad_actividades(2024);
```

### **👨‍🏫 Dirigente de Rama:**
```sql
-- Análisis de participación de su rama
SELECT analizar_participacion_scout(
  p_rama := 'LOBATOS',
  p_periodo_meses := 3
);

-- Progresión de scouts
SELECT analizar_progresion_por_rama('LOBATOS', 6);

-- Ranking de participación
SELECT generar_ranking_participacion(6, 'LOBATOS', 'GENERAL');
```

### **📋 Secretario:**
```sql
-- Reporte de asistencias
SELECT generar_reporte_asistencias_consolidado();

-- Análisis de retención
SELECT analizar_retencion_scouts(2);

-- Utilización de recursos
SELECT analizar_utilizacion_recursos('INSTALACIONES', 6);
```

---

## 📈 **Visualización de Datos**

### **Gráficos Recomendados por Función:**

#### **Dashboard Principal:**
- 📊 **Gauge Charts** - KPIs principales (asistencia, participación)
- 📈 **Line Charts** - Tendencias temporales
- 🥧 **Pie Charts** - Distribución por rama/categoría
- 📊 **Bar Charts** - Comparativas mensuales

#### **Reportes Financieros:**
- 💹 **Waterfall Charts** - Flujo de ingresos/gastos
- 📊 **Stacked Bar Charts** - Gastos por categoría
- 📈 **Trend Lines** - Proyecciones futuras

#### **Análisis de Participación:**
- 🎯 **Heat Maps** - Participación por scout/actividad
- 📊 **Funnel Charts** - Progresión por especialidades
- 🏆 **Ranking Tables** - Top performers

---

## 🔒 **Seguridad y Permisos**

### **Niveles de Acceso:**
```sql
-- Reportes públicos (todos los dirigentes)
- Dashboard básico
- Estadísticas generales
- Reportes de actividades

-- Reportes restringidos (coordinadores)
- Estados financieros detallados
- Análisis individual de scouts
- Datos sensibles

-- Reportes ejecutivos (coordinador general)
- Reportes consolidados completos
- Proyecciones estratégicas
- Análisis de performance dirigentes
```

### **Audit Trail:**
```sql
-- Registro automático de acceso a reportes
CREATE TRIGGER audit_reportes_acceso 
  AFTER EXECUTE ON reportes_functions
  FOR EACH ROW EXECUTE audit_log_access();
```

---

## ⚡ **Performance y Optimización**

### **Cache de Reportes:**
```sql
-- Reportes con cache inteligente (actualización cada 6 horas)
SELECT obtener_dashboard_cached();

-- Reportes bajo demanda (sin cache)
SELECT generar_reporte_ejecutivo_fresh();
```

### **Vistas Materializadas:**
```sql
-- Vista con métricas pre-calculadas
SELECT * FROM mv_metricas_dashboard;

-- Estadísticas históricas consolidadas
SELECT * FROM mv_estadisticas_historicas;
```

### **Optimización de Consultas:**
```sql
-- Uso de CTEs para consultas complejas
-- Índices específicos para reportes
-- Paginación automática para reportes grandes
```

---

## 🧪 **Testing y Validación**

### **Validación de Reportes:**
```sql
-- Validar integridad de datos en reportes
SELECT validar_integridad_reportes();

-- Test de performance de reportes
SELECT test_performance_reportes();

-- Verificar cálculos financieros
SELECT validar_calculos_financieros();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo React Dashboard:**
```typescript
interface DashboardData {
  kpisPrincipales: KPIs;
  tendencias: TendenciasData;
  alertas: Alerta[];
  graficos: GraficoConfig[];
}

export class ReportesService {
  async obtenerDashboard(periodo?: PeriodoDashboard): Promise<DashboardData> {
    const { data } = await supabase.rpc('generar_dashboard_principal', periodo);
    return this.transformDashboardData(data.data);
  }
  
  async exportarReporte(
    tipo: TipoReporte, 
    formato: FormatoExportacion,
    filtros?: FiltrosReporte
  ): Promise<Blob> {
    const { data } = await supabase.rpc('exportar_datos_reporte', {
      p_tipo_reporte: tipo,
      p_formato: formato,
      p_filtros: filtros
    });
    
    return new Blob([data.contenido], { type: data.mime_type });
  }
}
```

### **Componente Dashboard:**
```typescript
export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>();
  
  useEffect(() => {
    reportesService.obtenerDashboard()
      .then(setDashboardData);
  }, []);
  
  return (
    <div className="dashboard-grid">
      <KPICards data={dashboardData?.kpisPrincipales} />
      <TendenciasChart data={dashboardData?.tendencias} />
      <AlertasPanel alertas={dashboardData?.alertas} />
    </div>
  );
};
```

---

## 📊 **Métricas y KPIs Disponibles**

### **KPIs Operativos:**
- 👥 Total scouts activos/inactivos
- 📅 Porcentaje de asistencia promedio
- 🏆 Scouts con progresión activa
- 📋 Actividades realizadas vs planificadas
- 💰 Eficiencia presupuestaria

### **KPIs Financieros:**
- 💵 Ingresos/Gastos por período
- 📈 Variación presupuestaria
- 💰 Costo por scout/actividad
- 🎯 ROI de actividades
- 📊 Liquidez y reservas

### **KPIs de Calidad:**
- ⭐ Satisfacción en actividades
- 🎯 Efectividad de programas
- 👥 Retención de scouts
- 🏅 Progresión promedio
- 📈 Crecimiento del grupo

---

**📈 Total: 15 funciones especializadas en reportes y analytics**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**