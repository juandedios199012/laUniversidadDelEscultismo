# Cálculo de Áreas de Crecimiento — Módulo Progresión V4

## ¿Qué muestra una tarjeta de área?

```
┌─────────────────────────┐
│  💪  CORPORALIDAD        │
│                          │
│     ████░░░░░  3.4%      │
│                          │
│  20/587 objetivos        │
└─────────────────────────┘
```

- **20** → objetivos completados en toda la tropa para esta área
- **587** → total de objetivos posibles en toda la tropa para esta área
- **3.4%** → porcentaje de avance global de la tropa en esta área

---

## Fórmula paso a paso

### Paso 1 — Por cada scout, contar sus objetivos del área

Para cada uno de los 40 scouts se consulta la función SQL `obtener_objetivos_scout(scout_id)`.

Esta función devuelve **todos los objetivos del grupo de etapa del scout** (no de todas las etapas), determinado por la edad:

| Edad | Etapa | Grupo de objetivos |
|------|-------|--------------------|
| ≤ 11 años | PISTA    | PISTA_SENDA    |
| 12 años   | SENDA    | PISTA_SENDA    |
| 13 años   | RUMBO    | RUMBO_TRAVESIA |
| ≥ 14 años | TRAVESIA | RUMBO_TRAVESIA |

Por cada objetivo recibido:

```
si area_codigo == 'CORPORALIDAD':
    total_scout += 1
    si completado == true:
        completados_scout += 1
```

### Paso 2 — Sumar todos los scouts (aggregación global)

```
CORPORALIDAD.total      = total_scout₁ + total_scout₂ + ... + total_scout₄₀
CORPORALIDAD.completados = comp_scout₁  + comp_scout₂  + ... + comp_scout₄₀
```

Ejemplo numérico para llegar a 587:

| Scouts | Grupo | Obj. Corporalidad por scout | Subtotal |
|--------|-------|-----------------------------|----------|
| 35 scouts | PISTA_SENDA | 15 obj. | 525 |
| 5 scouts  | RUMBO_TRAVESIA | ~12 obj. | 62 |
| **Total** | | | **≈ 587** |

### Paso 3 — Calcular el porcentaje

```
porcentaje = (completados / total) × 100
           = (20 / 587)  × 100
           = 3.408...
           ≈ 3.4%
```

---

## ¿Qué significa este número?

> De todos los objetivos de Corporalidad posibles en la tropa completa,
> el **3.4%** están marcados como completados.

Es un **acumulado plano** de toda la tropa, no un promedio de porcentajes individuales.

### Diferencia entre ambos enfoques

| Método | Fórmula | Resultado ejemplo |
|--------|---------|-------------------|
| **Acumulado plano** (el que usamos) | `(Σ completados) / (Σ totales) × 100` | 3.4% |
| **Promedio de porcentajes** (no usado) | `(Σ porcentaje_scout) / N_scouts` | podría dar 8% si pocos scouts tienen avance alto |

Se eligió el **acumulado plano** porque representa con mayor fidelidad el estado real de la tropa: un scout con 50% completado no "eleva" el promedio si los otros 39 están en 0%.

---

## Las 6 áreas de crecimiento

| Código en BD | Nombre | Icono |
|-------------|--------|-------|
| `CORPORALIDAD`   | Corporalidad   | 💪 |
| `CREATIVIDAD`    | Creatividad    | 🎨 |
| `CARACTER`       | Carácter       | 🦁 |
| `AFECTIVIDAD`    | Afectividad    | ❤️ |
| `SOCIABILIDAD`   | Sociabilidad   | 🤝 |
| `ESPIRITUALIDAD` | Espiritualidad | ✨ |

> **Nota:** Los códigos en la base de datos usan el nombre completo (`CORPORALIDAD`, no `CORP`).  
> El frontend debe usar siempre estos códigos completos para que los mapas de colores e iconos coincidan.

---

## Dónde vive cada pieza del cálculo

| Pieza | Archivo |
|-------|---------|
| Consulta por scout | `src/services/progresionService.ts` → `obtenerObjetivosScout()` |
| Aggregación global | `src/components/ProgresionV4/useProgresionV4Data.ts` → `globalAreas` |
| Renderizado de tarjetas | `src/components/ProgresionV4/V4Components.tsx` → `<AreaCard>` |
| Función SQL | `database/progresion/11_fix_rpc_etapa_por_edad_progresion_v4.sql` → `obtener_objetivos_scout` |
| Constantes de colores/iconos | `src/components/ProgresionV4/useProgresionV4Data.ts` → `AREA_COLORS`, `AREA_ICONS`, `AREA_NAMES` |
