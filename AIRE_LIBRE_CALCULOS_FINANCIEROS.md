# Aire Libre — Valores y cálculos financieros

Referencia de cada monto que muestra el módulo **Actividades al Aire Libre**: de dónde sale, cómo se calcula y qué significa.

> Ejemplo usado en todo el documento: **REUNIÓN CONJUNTA LIMA 102 Y LIMA 12**
> — Recaudado S/ 241.00 · Estimado S/ 218.50 · Gastado S/ 218.50

---

## 1. Fuentes de datos

Todo el dinero del módulo sale de cuatro lugares:

| Fuente | Tabla / vista | Qué aporta |
|---|---|---|
| Pagos de participantes | `participantes_actividad.monto_pagado` | Lo **recaudado** |
| Ítems planificados (Menú, Materiales, Logística) | `v_presupuesto_vs_real_actividad` (une `ingredientes_menu`, `materiales_bloque`, `logistica_actividad`) | Lo **estimado** y, cuando se marcan como comprados, lo **gastado** |
| Compras directas (pestaña COMPRAS) | `compras_actividad.monto_total` | **Gastado** sin estimado previo |
| Paso Costos del asistente | `costos_actividad_aire_libre` → `actividades_aire_libre.costo_por_participante` | Lo que **debe pagar** cada participante |

### Estados que cuentan como "comprado"

Un ítem planificado suma a lo gastado solo si su estado es `COMPRADO`, `CONFIRMADO` o `RECIBIDO`. Si está `PENDIENTE`, solo suma al estimado.

Las compras directas siempre cuentan como gastadas.

### Precio real de un ítem planificado

```
subtotal_real = COALESCE(subtotal_real, subtotal_estimado)
```

Si al marcar el ítem como comprado no se ingresa un precio real, se asume el estimado.

---

## 2. Función `api_obtener_dashboard_presupuesto`

Definida en [database/162_eliminar_presupuesto_base_dashboard.sql](database/162_eliminar_presupuesto_base_dashboard.sql). Alimenta la pestaña PRESUPUESTO y las tarjetas superiores.

| Campo | Cálculo |
|---|---|
| `total_estimado` | Σ `subtotal_estimado` de todos los ítems planificados |
| `total_real` | Σ `subtotal_real` de ítems comprados **+** Σ `monto_total` de compras directas |
| `total_pendiente` | Σ `subtotal_estimado` de ítems `PENDIENTE` |
| `diferencia_global` | `total_real − total_estimado` |
| `ahorro` | `total_estimado − total_real` si es positivo, si no 0 |
| `sobrecosto` | `total_real − total_estimado` si es positivo, si no 0 |
| `items_comprados` | Nº ítems planificados comprados **+** Nº compras directas |
| `items_pendientes` | Nº ítems planificados `PENDIENTE` |
| `total_items` | Nº ítems planificados **+** Nº compras directas |
| `total_vouchers` | Nº vouchers adjuntos a ítems planificados |
| `porcentaje_avance` | `items_comprados / (items_comprados + items_pendientes) × 100` |
| `por_categoria` | Ver sección 4 |

---

## 3. Tarjetas superiores (todas las pestañas)

Código: [ActividadDetalle.tsx:403-410](src/components/ActividadesExterior/ActividadDetalle.tsx#L403-L410)

| Tarjeta | Cálculo | Ejemplo |
|---|---|---|
| **Confirmados** | participantes confirmados / total participantes | — |
| **Autorizaciones** | participantes con autorización `FIRMADA`, `RECIBIDA` o `EXONERADA` / total | — |
| **Recaudado** | Σ `monto_pagado` de los participantes | S/ 241.00 |
| **Gastado** | `total_real` (ítems comprados + compras directas) | S/ 218.50 |
| **Saldo a favor / en contra** | `Recaudado − Gastado`. Verde si ≥ 0, rojo si < 0 | **S/ 22.50 a favor** |

> El **Saldo** es la caja real de la actividad: cuánto dinero sobra (o falta) después de pagar todo lo comprado.

---

## 4. Pestaña PRESUPUESTO

Código: [PresupuestoDashboard.tsx](src/components/ActividadesExterior/components/PresupuestoDashboard.tsx)

Esta pestaña es **control de compras**: compara lo que se planificó gastar contra lo que realmente se gastó. **No considera lo recaudado.**

### 4.1 KPIs principales

| Tarjeta | Cálculo | Ejemplo |
|---|---|---|
| **Estimado** | `total_estimado` | S/ 218.50 |
| **Real** | `total_real` (muestra "—" si es 0) | S/ 218.50 |
| **Ahorro / Sobrecosto** | `\|total_real − total_estimado\|`. Ahorro si real < estimado; sobrecosto si real > estimado | — (diferencia 0) |
| **Avance** | `min(total_real / total_estimado × 100, 100)` + conteo de comprados y pendientes | 100% |

Cabecera: `items_comprados / total_items comprados` (si la función no devuelve `total_items`, se usa `items_comprados + items_pendientes`).

### 4.2 Desglose por categoría

Ítems planificados y compras directas se agrupan en **una sola fila por categoría**. Los nombres se normalizan así:

| Origen | Categoría original | Se muestra como |
|---|---|---|
| Menú (ingredientes) | `MENU` | `ALIMENTACION` |
| Materiales | `MATERIALES` | `MATERIALES` |
| Logística | `LOGISTICA` | `LOGISTICA` |
| Compra directa | `ALIMENTACION` / `MENU` | `ALIMENTACION` |
| Compra directa | `TRANSPORTE`, `ALQUILER` | `LOGISTICA` |
| Compra directa | `ALOJAMIENTO`, `SEGURO`, `OTROS`, vacío | Su propio nombre (vacío → `OTROS`) |

Por cada categoría:

| Valor | Cálculo |
|---|---|
| Estimado | Σ `subtotal_estimado` de ítems planificados de la categoría (las compras directas aportan 0) |
| Real | Σ `subtotal_real` de ítems comprados + Σ compras directas de la categoría |
| Diferencia | `Real − Estimado` |
| Avance (barra) | `Real / Estimado × 100` (0 si no hay estimado) |
| Nº items | ítems planificados + compras directas |

Indicador al lado del monto:

| Condición | Indicador |
|---|---|
| Estimado = 0 y Real > 0 | Badge ámbar **"Sin presupuesto"** (gasto no planificado) |
| Real < Estimado | Badge verde con el ahorro |
| Real > Estimado | Badge rojo con el sobrecosto |
| Real = Estimado o Real = 0 | Sin badge |

### 4.3 Resumen final

| Lado | Cálculo |
|---|---|
| Mensaje | **Compras en progreso** si hay ítems pendientes · **Compras completadas** si `items_comprados ≥ total_items` · si no, **Sin compras registradas** |
| Monto principal | **Total gastado** (`total_real`); si aún no hay compras, **Total estimado** |
| Comparación | "Igual a lo estimado", "Ahorro: S/ X" o "Sobrecosto: S/ X" según `total_real − total_estimado` |

Ejemplo: *Compras completadas · Total gastado S/ 218.50 · Igual a lo estimado*.

---

## 5. Pestaña COMPRAS

Código: [ActividadDetalle.tsx](src/components/ActividadesExterior/ActividadDetalle.tsx) (sección "Compras Realizadas")

| Tarjeta | Cálculo |
|---|---|
| **Compras directas** | Σ `monto_total` de `compras_actividad` (solo lo registrado en esta pestaña) |
| **Estimado** | `total_estimado` |
| **Disponible** | `Estimado − Gastado total` (`total_real`). Verde si ≥ 0, rojo si < 0 |

> "Disponible" indica cuánto del presupuesto planificado queda sin gastar. Usa el gastado **total**, no solo las compras directas.

---

## 6. Cobro a participantes

| Valor | Cálculo |
|---|---|
| **Costo por participante** | Suma de los montos del paso **Costos** del asistente (un monto por cada tipo de costo de *Configuración › Tipos de Costo*). Se guarda en `costo_por_participante` |
| **Monto a pagar** (por participante) | `monto_a_pagar` del participante, o `costo_por_participante` si no tiene uno propio |
| **Pagado completo** | `monto_pagado ≥ costo_por_participante` ([actividadesExteriorService.ts:1631-1632](src/services/actividadesExteriorService.ts#L1631-L1632)) |

> El costo por participante **solo** define cuánto se cobra. Ya no se compara contra lo gastado (la comparativa "Presupuesto base" se eliminó en la migración 162).

---

## 7. Resumen: qué pregunta responde cada número

| Pregunta | Dónde mirar |
|---|---|
| ¿Cuánto dinero entró? | **Recaudado** (arriba) |
| ¿Cuánto se gastó en total? | **Gastado** (arriba) o **Total gastado** (PRESUPUESTO) |
| ¿Cuánto sobra o falta en caja? | **Saldo** (arriba) |
| ¿Compré más caro o más barato de lo planeado? | **Ahorro / Sobrecosto** y **Resumen final** (PRESUPUESTO) |
| ¿Qué gastos no estaban planificados? | Categorías con badge **"Sin presupuesto"** (PRESUPUESTO) |
| ¿Cuánto del plan queda por gastar? | **Disponible** (COMPRAS) |
| ¿Cuánto debe pagar cada participante? | **Costo por participante** (paso Costos) |

---

## 8. Migraciones relacionadas

| Archivo | Cambio |
|---|---|
| [161_fix_dashboard_presupuesto_categorias.sql](database/161_fix_dashboard_presupuesto_categorias.sql) | Une compras directas con su categoría, normaliza nombres, quita duplicados, agrega `total_items` |
| [162_eliminar_presupuesto_base_dashboard.sql](database/162_eliminar_presupuesto_base_dashboard.sql) | Quita `presupuesto_base`, `diferencia_base_real` y `porcentaje_ejecucion_vs_base`; elimina la vista `v_presupuesto_consolidado_actividad` (versión base vs real) |

Ambas deben ejecutarse en Supabase, en ese orden.
