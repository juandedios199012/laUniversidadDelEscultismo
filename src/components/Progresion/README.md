# Módulo Progresión V4

Sistema de seguimiento de progresión scout con datos reales desde Supabase.

---

## Pestañas

| Tab | Componente | Descripción |
|-----|------------|-------------|
| Progresión | `V4ProgresionTab` | KPIs globales y barras por etapa |
| Scouts | `V4ScoutsTab` | Lista individual de scouts |
| Análisis | `V4AnalisisTab` | Gráficos de distribución |
| Dashboard | `V4DashboardTab` | Dashboard ejecutivo con gráficos + exportación PDF grupal |
| Portal Padres | `V4PortalPadresTab` | Vista individual por scout + exportación PDF para padres |

---

## PDF — Portal Padres (`V4PortalPadresTab`)

### Estructura del informe exportado

| Sección | Tipo visual | Descripción |
|---------|-------------|-------------|
| Header | Banda de color (color de etapa) | Nombre del scout, fecha, etapa y % en pastilla |
| KPI Strip | Tarjetas | Objetivos, Progreso %, Etapa, Patrulla, Código |
| Barra de progreso | Barra horizontal | Progreso global del scout |
| Áreas de Crecimiento | Mini chart + barras horizontales | (ver detalle abajo) |
| Objetivos Completados | Tabla | Lista de objetivos con área y fecha |
| Especialidades Logradas | Tabla | Especialidades con área y fecha |
| Récord de Asistencia | KPIs + barras horizontales | Presente / Tardanza / Ausente + % total |
| Footer | Banda de color | Número de página |

### Sección "Áreas de Crecimiento" (estilo Dashboard)

Implementa el mismo lenguaje visual que el tab **Dashboard**, en dos capas:

#### 1. Mini-chart de columnas apiladas
Muestra las 6 áreas en una fila compacta. Cada columna tiene:
- Segmento inferior coloreado = objetivos completados
- Segmento superior gris = objetivos pendientes
- Porcentaje sobre la barra

#### 2. Barras horizontales individuales
Una barra por área con el color oficial de cada área:

| Área | Color oficial |
|------|---------------|
| Corporalidad | `#E31E24` rojo |
| Creatividad | `#F5C800` amarillo |
| Carácter | `#0054A6` azul |
| Afectividad | `#808285` gris |
| Sociabilidad | `#00A651` verde |
| Espiritualidad | `#9B59B6` violeta* |

> *El color de Espiritualidad en el PDF es `#9B59B6` (violeta) en lugar del `#D1D3D4` (gris claro) que usa la UI, ya que el gris claro es prácticamente invisible sobre fondo blanco en impresión.

Cada barra muestra: `Nombre  [████░░░░]  XX%` y debajo `N / M objetivos`.

---

## PDF — Dashboard (`V4DashboardTab`)

### Estructura del informe exportado (2 páginas)

**Página 1:**
- Header azul con promedio global
- KPI Strip: Scouts Activos, Completados, Total Objetivos, Promedio Global
- Gráfico de barras apiladas por área (completados vs pendientes)
- Tarjetas de distribución por etapa (con color de etapa)

**Página 2:**
- Barras horizontales de % avance por área (mayor a menor)
- Gráfico de columnas: distribución de scouts por nivel de progreso (0-25%, 25-50%, 50-75%, 75-100%)
- Tabla Top 10 scouts por progreso
- Insights: mejor y peor área

---

## Colores oficiales de Áreas de Crecimiento

Definidos en `useProgresionV4Data.ts` → `AREA_COLORS`:

```ts
CORPORALIDAD:   '#E31E24'
CREATIVIDAD:    '#F5C800'
CARACTER:       '#0054A6'
AFECTIVIDAD:    '#808285'
SOCIABILIDAD:   '#00A651'
ESPIRITUALIDAD: '#D1D3D4'  // en UI; #9B59B6 en PDF
```

Ver cálculo detallado de áreas: [`database/progresion/CALCULO_AREAS_CRECIMIENTO.md`](../../../database/progresion/CALCULO_AREAS_CRECIMIENTO.md)

---

## Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `ProgresionV4Module.tsx` | Shell con tabs y navegación |
| `useProgresionV4Data.ts` | Hook de datos, constantes de colores/iconos/etapas |
| `V4Components.tsx` | Componentes UI reutilizables (`KpiCard`, `CardSkeleton`, `AreaCard`) |
| `tabs/V4PortalPadresTab.tsx` | Vista y PDF para padres |
| `tabs/V4DashboardTab.tsx` | Dashboard ejecutivo y PDF grupal |
| `tabs/V4ProgresionTab.tsx` | Vista de progresión por etapas |
| `tabs/V4ScoutsTab.tsx` | Lista de scouts |
| `tabs/V4AnalisisTab.tsx` | Gráficos de análisis |
