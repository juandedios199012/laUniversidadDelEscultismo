# 📊 Guía de KPIs - Sistema de Gestión Scout

## Definiciones de Indicadores Clave

### Módulo: Registro de Scouts

| KPI | Definición | Lógica de Cálculo |
|-----|------------|-------------------|
| **Total Registrados** | Cantidad total de scouts en el sistema | `COUNT(*) FROM scouts` |
| **Scouts Activos** | Scouts con estado ACTIVO | `COUNT(*) WHERE estado = 'ACTIVO'` |
| **Nuevos (12 meses)** | Scouts activos registrados en los últimos 12 meses | `COUNT(*) WHERE estado = 'ACTIVO' AND fecha_ingreso >= CURRENT_DATE - 12 meses` |
| **Dirigentes** | Scouts activos marcados como dirigentes | `COUNT(*) WHERE estado = 'ACTIVO' AND es_dirigente = TRUE` |

---

## Decisiones de Diseño

### ¿Por qué "Últimos 12 meses" en lugar de "Año calendario"?

**Problema identificado:** Si un scout ingresó el 22/02/2025 y estamos en enero 2026, con lógica de "año calendario" NO se contaría, aunque haya ingresado hace menos de un año.

**Opciones evaluadas:**

| Opción | Descripción | Ventajas | Desventajas |
|--------|-------------|----------|-------------|
| **Año calendario** | Solo cuenta año actual (ej: 2026) | Simple de entender | En enero muestra casi 0, pierde contexto |
| **Últimos 12 meses** ✅ | Ventana móvil desde hoy | Siempre relevante, muestra crecimiento real | Requiere cálculo de fecha |
| **Año scout** | Período fijo (Marzo-Marzo) | Alineado a ciclo scout | Menos intuitivo, depende de configuración |

**Decisión:** Se implementó **"Últimos 12 meses"** porque:
1. ✅ Siempre muestra crecimiento reciente y relevante
2. ✅ No depende del momento del año
3. ✅ Más útil operativamente para gestión
4. ✅ Un scout que ingresó hace 11 meses aún cuenta como "nuevo"

---

## Implementación Técnica

### Arquitectura de Datos

> **IMPORTANTE:** `fecha_ingreso` está en la tabla **personas**, no en scouts.
> Esto permite rastrear la fecha de ingreso de cualquier persona al grupo,
> independientemente de su rol (scout, dirigente, familiar, etc.).

### SQL (PostgreSQL/Supabase)
```sql
-- KPI: Nuevos en últimos 12 meses (lee de personas)
COUNT(CASE 
    WHEN s.estado = 'ACTIVO' 
    AND COALESCE(p.fecha_ingreso, p.created_at::DATE) >= (CURRENT_DATE - INTERVAL '12 months')
    THEN 1 
END) as nuevos_año
FROM scouts s
JOIN personas p ON s.persona_id = p.id
```

### Frontend (TypeScript - Fallback)
```typescript
const hace12Meses = new Date();
hace12Meses.setFullYear(hace12Meses.getFullYear() - 1);

const nuevosEsteAño = scouts.filter(s => {
  if (s.estado !== 'ACTIVO') return false;
  const fechaIngreso = s.fecha_ingreso || s.created_at;
  if (!fechaIngreso) return false;
  return new Date(fechaIngreso) >= hace12Meses;
}).length;
```

---

## KPIs por Módulo

### Dashboard Principal
- Total de scouts activos
- Scouts por rama
- Actividades planificadas/en curso
- Items de inventario disponibles
- Alertas de stock bajo

### Inscripciones Anuales
- Total inscritos (período actual)
- Pagados vs Pendientes
- Monto recaudado
- Desglose por rama

### Asistencia
- Porcentaje de asistencia promedio
- Tendencia mensual
- Scouts con baja asistencia (<70%)

### Progresión
- Scouts con progresión activa
- Especialidades completadas
- Tiempo promedio de avance

---

## Buenas Prácticas

1. **Consistencia:** Usar la misma lógica en SQL y frontend (fallback)
2. **Fallback:** Siempre tener cálculo local si el servidor falla
3. **Cache:** Los KPIs se cachean por 2 horas para performance
4. **Documentación:** Actualizar este archivo al agregar nuevos KPIs

---

## Archivos Relacionados

- **SQL Dashboard:** `database/fix_api_dashboard_nuevos_año.sql`
- **Frontend KPIs:** `src/components/RegistroScout/RegistroScout.tsx`
- **Servicio:** `src/services/scoutService.ts` → `getEstadisticasGrupo()`

---

*Última actualización: 26 de enero de 2026*
