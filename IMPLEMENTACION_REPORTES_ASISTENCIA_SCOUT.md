# Implementación: Sistema de Reportes de Asistencia por Scout
**Fecha:** 20 de enero de 2026  
**Módulo:** Asistencia - Reportes para Padres de Familia

---

## 📋 Resumen

Se ha implementado un sistema completo de reportes de asistencia individual por scout, diseñado específicamente para padres de familia con las siguientes características:

### ✅ Características Implementadas

1. **📊 Vista Web Interactiva**
   - Dashboard con KPIs visuales (porcentaje, presentes, ausentes, racha)
   - Gráficos de distribución de asistencia
   - Historial detallado de todas las reuniones
   - Filtros por período de fechas
   - Diseño responsive y accesible

2. **📄 Exportación a PDF**
   - Plantilla profesional con diseño scout
   - Información completa del scout
   - Estadísticas visuales
   - Historial de asistencias
   - Nota para padres de familia
   - Footer institucional

3. **🎯 Indicadores Clave (KPIs)**
   - Porcentaje de asistencia total
   - Total de reuniones
   - Presentes / Ausentes / Tardanzas
   - Racha actual (reuniones consecutivas)
   - Tendencia (mejorando/estable/empeorando)

4. **♿ UX/UI Profesional**
   - Estados vacíos significativos
   - Feedback visual claro
   - Accesibilidad completa
   - Print-friendly
   - Mobile-responsive

---

## 📁 Archivos Creados

### Frontend

#### 1. Componente Principal
**Archivo:** `src/components/Asistencia/ReporteAsistenciaScout.tsx`
- Componente React con vista completa del reporte
- Filtros por scout y rango de fechas
- KPIs visuales con gráficos de progreso
- Historial detallado de asistencias
- Botones de exportación (PDF, Imprimir, Enviar)

#### 2. Servicio
**Archivo:** `src/services/reporteAsistenciaService.ts`
- `obtenerReporte()`: Obtiene datos del reporte desde BD
- `obtenerScoutsActivos()`: Lista de scouts para selector
- `generarPDF()`: Genera y descarga PDF del reporte

#### 3. Plantilla PDF
**Archivo:** `src/modules/reports/templates/pdf/AttendanceByScoutTemplate.tsx`
- Plantilla @react-pdf/renderer optimizada para padres
- Diseño profesional con colores scout
- Estadísticas visuales en badges
- Tabla de historial completo
- Nota informativa para padres

### Backend

#### 4. Función PostgreSQL
**Archivo:** `database/api_obtener_reporte_asistencia_scout.sql`

**Firma:**
```sql
api_obtener_reporte_asistencia_scout(
    p_scout_id UUID,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
) RETURNS JSON
```

**Funcionalidad:**
- Obtiene información del scout
- Calcula estadísticas (totales, porcentajes, racha)
- Determina tendencia (compara mitades del período)
- Retorna asistencias ordenadas por fecha
- Formato JSON estándar con `create_standard_response()`

---

## 🔧 Instalación

### 1. Base de Datos

Ejecutar el script SQL en Supabase:

```bash
psql -U postgres -h [HOST] -p 6543 -d postgres -f database/api_obtener_reporte_asistencia_scout.sql
```

O ejecutar directamente en el SQL Editor de Supabase:
```sql
-- Copiar y pegar el contenido de api_obtener_reporte_asistencia_scout.sql
```

### 2. Verificar Instalación

```sql
-- Test básico
SELECT api_obtener_reporte_asistencia_scout(
    'UUID_DEL_SCOUT'::UUID,
    '2024-01-01'::DATE,
    '2024-12-31'::DATE
);
```

### 3. Frontend

No requiere instalación adicional - los componentes ya están integrados.

---

## 📖 Uso

### Para Usuarios (Dirigentes)

1. Ir al módulo **Asistencia**
2. Click en botón **"Reportes por Scout"** (junto a "Nueva Reunión")
3. Seleccionar:
   - Scout del listado desplegable
   - Fecha inicio y fin del período
4. Ver reporte en pantalla con todos los KPIs
5. Opciones disponibles:
   - **Descargar PDF**: Genera PDF para enviar a padres
   - **Imprimir**: Imprime reporte directo
   - **Enviar**: (Próximamente) Enviar por email

### Para Padres de Familia

El reporte PDF descargado incluye:
- Nombre completo y código del scout
- Porcentaje de asistencia destacado
- Resumen de presentes, ausentes, tardanzas
- Racha de asistencias consecutivas
- Historial completo de todas las reuniones
- Nota explicativa sobre importancia de asistencia

---

## 🎨 Diseño y UX

### Principios Aplicados

✅ **Jerarquía Visual Clara**
- Porcentaje de asistencia como métrica principal (grande y destacado)
- KPIs secundarios en cards uniformes
- Historial con estados visuales (badges de color)

✅ **Estados Vacíos Significativos**
- Cuando no hay scout seleccionado: ilustración + CTA
- Cuando no hay asistencias: mensaje explicativo contextual

✅ **KPIs Visuales**
- Cards con iconos (Target, CheckCircle, XCircle, Award)
- Barras de progreso para distribución de estados
- Colores semánticos (verde=presente, rojo=ausente, etc.)

✅ **Responsive Design**
- Grid adaptativo: `grid-cols-2 md:grid-cols-4`
- Botones apilados en mobile
- Tabla con scroll horizontal si necesario

✅ **Accesibilidad**
- Labels descriptivos
- Contraste suficiente (WCAG AA)
- Print-friendly styles
- Touch targets 44x44px mínimo

---

## 🔍 Estructura de Datos

### Respuesta de `api_obtener_reporte_asistencia_scout`

```json
{
  "success": true,
  "message": "Reporte generado exitosamente",
  "data": {
    "scout": {
      "id": "uuid",
      "nombres": "Juan Carlos",
      "apellidos": "Pérez García",
      "codigo_scout": "SC-2024-001",
      "rama_actual": "TROPA",
      "foto_url": null
    },
    "asistencias": [
      {
        "fecha": "2024-01-15",
        "titulo": "Reunión Semanal",
        "estado": "presente",
        "tipo_actividad": "reunion_semanal"
      }
    ],
    "estadisticas": {
      "total_reuniones": 12,
      "total_presente": 10,
      "total_ausente": 1,
      "total_tardanza": 1,
      "total_justificado": 0,
      "porcentaje_asistencia": 91.67,
      "racha_actual": 3,
      "tendencia": "mejorando"
    },
    "periodo": {
      "fecha_inicio": "2024-01-01",
      "fecha_fin": "2024-03-31"
    }
  }
}
```

---

## 🧮 Algoritmos Implementados

### 1. Cálculo de Porcentaje de Asistencia

```sql
-- Se considera "asistió" tanto presente como tardanza
porcentaje = ((presente + tardanza) * 100.0) / total_reuniones
```

### 2. Racha Actual

```sql
-- Cuenta reuniones consecutivas (presente/tardanza) desde la más reciente
-- Se corta al encontrar una ausencia no justificada
```

### 3. Tendencia

```sql
-- Compara primera mitad vs segunda mitad del período
Si (segunda_mitad > primera_mitad + 5%) → "mejorando"
Si (segunda_mitad < primera_mitad - 5%) → "empeorando"
Sino → "estable"
```

---

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Envío automático por email a padres
- [ ] Comparación con promedio de la rama
- [ ] Gráfico de tendencia temporal

### Mediano Plazo
- [ ] Reporte consolidado de toda la rama
- [ ] Exportación a Excel
- [ ] Notificaciones automáticas si asistencia < 70%

### Largo Plazo
- [ ] Portal de padres con acceso directo
- [ ] Reportes predictivos con IA
- [ ] Integración con sistema de progresión

---

## 🔒 Seguridad y Permisos

- ✅ Función usa RLS de Supabase
- ✅ Solo usuarios autenticados pueden acceder
- ✅ Validación de UUID de scout
- ✅ No expone datos sensibles en logs
- ⚠️ **Recomendación:** Agregar RLS policy específica para que padres solo vean a sus hijos

---

## 🐛 Troubleshooting

### Error: "Scout no encontrado"
**Solución:** Verificar que el UUID sea válido y el scout exista en BD

### PDF no se descarga
**Solución:** Verificar que @react-pdf/renderer esté instalado:
```bash
npm install @react-pdf/renderer
```

### No aparecen scouts en el selector
**Solución:** Verificar que haya scouts con estado ACTIVO en la BD

### Estadísticas en 0
**Solución:** Verificar que existan asistencias en el rango de fechas seleccionado

---

## 📞 Soporte

Para consultas sobre este módulo, contactar al equipo de desarrollo o revisar:
- Documentación general: `IMPLEMENTACION_INSCRIPCIONES_ANUALES.md`
- Políticas de diseño: `.github/copilot-instructions.md`
- Arquitectura de reportes: `DOCUMENT_GENERATION_README.md`

---

## ✨ Créditos

**Desarrollado por:** GitHub Copilot + Equipo Grupo Scout Lima 12  
**Fecha:** 20 de enero de 2026  
**Stack:** React 18 + TypeScript + Supabase PostgreSQL + @react-pdf/renderer

---

**¡Siempre Listos! 🪶**
