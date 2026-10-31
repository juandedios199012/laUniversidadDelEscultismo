# Aire Libre — Valores y cálculos financieros

Referencia de cada monto que muestra el módulo **Actividades al Aire Libre**: de dónde sale, cómo se calcula, qué significa y cómo registrar los casos especiales.

> Ejemplo usado en el documento: **REUNIÓN CONJUNTA LIMA 102 Y LIMA 12**
> — Cuota S/ 13.00 · Recaudado S/ 241.00 · Logística: presupuesto S/ 126.00, gastado S/ 157.50

---

## 1. Fuentes de datos

Todo el dinero del módulo sale de cuatro lugares:

| Fuente | Tabla / vista | Qué aporta |
|---|---|---|
| Pagos de participantes | `participantes_actividad.monto_pagado` | Lo **recaudado** |
| Cuota de cada participante | `participantes_actividad.monto_a_pagar` (o `costo_por_participante` de la actividad) | Lo que **debe pagar** cada uno |
| Ítems planificados (Menú, Materiales, Logística) | `v_presupuesto_vs_real_actividad` (une `ingredientes_menu`, `materiales_bloque`, `logistica_actividad`) | Lo **estimado** y, cuando se pagan, lo **gastado** |
| Compras directas (pestaña COMPRAS) | `compras_actividad.monto_total` | **Gastado** sin estimado previo |

### Estados que cuentan como pagado

| Origen | Estados que suman a lo gastado |
|---|---|
| Menú (ingredientes) | `COMPRADO`, `RECIBIDO` |
| Materiales | `COMPRADO` |
| Logística | `CONFIRMADO`, `EN_LUGAR`, `DEVUELTO` (los dos últimos se normalizan a `CONFIRMADO` en la vista, migración 165) |
| Compras directas | Siempre |

Un ítem en `PENDIENTE` solo suma al estimado.

### Precio real de un ítem planificado

```
gastado = cantidad_real × precio_unitario_real
```

Si el ítem se marca como pagado **sin** registrar precio real, se asume el estimado (`COALESCE(subtotal_real, subtotal_estimado)`).

| Pestaña | Cómo registrar el precio real |
|---|---|
| Menú | Botón de compra del ingrediente → diálogo **Registrar compra** |
| Logística | Botón de recibo **Registrar precio real** en cada ítem (marca el ítem como `CONFIRMADO`) |
| Materiales | ⚠️ Aún no disponible: solo se puede cambiar el estado, así que se asume el estimado |

---

## 2. Tarjetas superiores (todas las pestañas)

Código: [ActividadDetalle.tsx](src/components/ActividadesExterior/ActividadDetalle.tsx)

| Tarjeta | Cálculo | Ejemplo |
|---|---|---|
| **Confirmados** | participantes confirmados / total participantes | — |
| **Autorizaciones** | participantes con autorización `FIRMADA`, `RECIBIDA` o `EXONERADA` / total | — |
| **Recaudado** | Σ `monto_pagado` de los participantes | S/ 241.00 |
| **Gastado** | `total_real` (ítems pagados + compras directas) | — |
| **Saldo a favor / en contra** | `Recaudado − Gastado`. Verde si ≥ 0, rojo si < 0 | — |

> El **Saldo** es la caja real de la actividad: cuánto dinero sobra (o falta) después de pagar todo lo gastado.

---

## 3. Pestaña PRESUPUESTO

Código: [PresupuestoDashboard.tsx](src/components/ActividadesExterior/components/PresupuestoDashboard.tsx) · datos de `api_obtener_dashboard_presupuesto`

Esta pestaña es **control de compras**: compara lo planificado contra lo realmente gastado. **No considera lo recaudado.**

### 3.1 Función `api_obtener_dashboard_presupuesto`

| Campo | Cálculo |
|---|---|
| `total_estimado` | Σ `subtotal_estimado` de todos los ítems planificados |
| `total_real` | Σ `subtotal_real` de ítems pagados **+** Σ `monto_total` de compras directas |
| `total_pendiente` | Σ `subtotal_estimado` de ítems `PENDIENTE` |
| `diferencia_global` | `total_real − total_estimado` |
| `ahorro` / `sobrecosto` | La diferencia, según su signo (el otro queda en 0) |
| `items_comprados` | Nº ítems planificados pagados **+** Nº compras directas |
| `items_pendientes` | Nº ítems planificados `PENDIENTE` |
| `total_items` | Nº ítems planificados **+** Nº compras directas |
| `porcentaje_avance` | `items_comprados / (items_comprados + items_pendientes) × 100` |
| `por_categoria` | Ver 3.3 |

### 3.2 KPIs principales

| Tarjeta | Cálculo |
|---|---|
| **Estimado** | `total_estimado` |
| **Real** | `total_real` ("—" si es 0) |
| **Ahorro / Sobrecosto** | `\|total_real − total_estimado\|` |
| **Avance** | `min(total_real / total_estimado × 100, 100)` + comprados y pendientes |

Cabecera: `items_comprados / total_items comprados`.

### 3.3 Desglose por categoría

Ítems planificados y compras directas se agrupan en **una sola fila por categoría**:

| Origen | Categoría original | Se muestra como |
|---|---|---|
| Menú (ingredientes) | `MENU` | `ALIMENTACION` |
| Materiales | `MATERIALES` | `MATERIALES` |
| Logística | `LOGISTICA` | `LOGISTICA` |
| Compra directa | `ALIMENTACION` / `MENU` | `ALIMENTACION` |
| Compra directa | `TRANSPORTE`, `ALQUILER` | `LOGISTICA` |
| Compra directa | `ALOJAMIENTO`, `SEGURO`, `OTROS`, vacío | Su propio nombre (vacío → `OTROS`) |

| Valor | Cálculo |
|---|---|
| Estimado | Σ estimado de los ítems planificados de la categoría (compras directas aportan 0) |
| Real | Σ gastado de ítems pagados + Σ compras directas de la categoría |
| Diferencia | `Real − Estimado` |
| Avance (barra) | `Real / Estimado × 100` (0 si no hay estimado) |

| Condición | Indicador |
|---|---|
| Estimado = 0 y Real > 0 | Badge ámbar **"Sin presupuesto"** (gasto no planificado) |
| Real < Estimado | Badge verde con el ahorro |
| Real > Estimado | Badge rojo con el sobrecosto |
| Real = Estimado o Real = 0 | Sin badge |

### 3.4 Resumen final

| Lado | Cálculo |
|---|---|
| Mensaje | **Compras en progreso** si hay pendientes · **Compras completadas** si `items_comprados ≥ total_items` · si no, **Sin compras registradas** |
| Monto principal | **Total gastado** (`total_real`); si aún no hay compras, **Total estimado** |
| Comparación | "Igual a lo estimado", "Ahorro: S/ X" o "Sobrecosto: S/ X" |

---

## 4. Pestaña LOGÍSTICA

Código: [LogisticaTab.tsx](src/components/ActividadesExterior/components/LogisticaTab.tsx)

| Valor | Cálculo |
|---|---|
| **Total** (por ítem) | Estimado: `costo_total_alquiler` o `subtotal` (cantidad × precio unitario) |
| **Real** (por ítem) | `cantidad_real × precio_unitario_real`, debajo del total (rojo si costó más, verde si menos) |
| **Gastado** (por ítem) | Real si se registró; si está pagado sin precio real, el estimado; si está pendiente, 0 |
| **Presupuesto** (tarjeta) | Σ estimado; debajo, **Gastado** |
| **Confirmados** (tarjeta) | Ítems en `CONFIRMADO`, `EN_LUGAR` o `DEVUELTO` |
| **Encabezado de categoría** | Nº ítems · Σ estimado · Gastado |
| **Total Logística** | Presupuesto · **Gastado** · Sobrecosto/Ahorro = Gastado − estimado **de los ítems ya pagados** (lo pendiente no cuenta como ahorro) |

Ejemplo:

| Ítem | Estimado | Real |
|---|---|---|
| Pasajes de los 18 Scouts (18 × S/ 6.00 → S/ 7.50) | S/ 108.00 | S/ 135.00 |
| Pasajes de los Jefes (3 × S/ 6.00 → S/ 7.50) | S/ 18.00 | S/ 22.50 |
| **Total Logística** | **S/ 126.00** | **S/ 157.50** · Sobrecosto S/ 31.50 |

---

## 5. Pestaña COMPRAS

Código: [ActividadDetalle.tsx](src/components/ActividadesExterior/ActividadDetalle.tsx) (sección "Compras Realizadas")

| Tarjeta | Cálculo |
|---|---|
| **Compras directas** | Σ `monto_total` de `compras_actividad` (solo lo registrado en esta pestaña) |
| **Estimado** | `total_estimado` |
| **Disponible** | `Estimado − Gastado total` (`total_real`). Verde si ≥ 0, rojo si < 0 |

> Usar COMPRAS para gastos **no planificados** (imprevistos). Lo planificado va en Menú, Materiales o Logística y se le registra el precio real.

---

## 6. Pestaña REPORTES (dentro de la actividad)

Código: [ReportesTab.tsx](src/components/ActividadesExterior/components/ReportesTab.tsx)

**Resumen Financiero:**

| Fila | Cálculo |
|---|---|
| **Cuotas esperadas** | Σ cuota de cada participante (`monto_a_pagar`, o `costo_por_participante` si no tiene uno propio) |
| **Cuotas recaudadas** | Σ `monto_pagado` |
| **Cuotas pendientes** | Esperadas − Recaudadas |
| **Total gastado** | `total_real` |
| **Saldo** | Recaudadas − Total gastado (mismo valor que la tarjeta **Saldo** de arriba) |

**Exportación "Presupuesto"** (PDF / Excel): cada ítem de Menú, Materiales y Logística con cantidad, P. unit., Estimado, Gastado y Estado. Fuente: `api_obtener_detalle_presupuesto_actividad`.

> El reporte financiero completo en PDF está en el **módulo Reportes** (sección 8).

---

## 7. Cobro a participantes

| Valor | Cálculo |
|---|---|
| **Costo por participante** | Suma de los montos del paso **Costos** del asistente (un monto por cada tipo de *Configuración › Tipos de Costo*). Se guarda en `costo_por_participante` |
| **Cuota del participante** | `monto_a_pagar` del participante, o `costo_por_participante` si no tiene una propia |
| **Pendiente** | `max(cuota − monto_pagado, 0)` |
| **Pagado completo** | `monto_pagado ≥ monto_a_pagar` (columna calculada `pagado_completo`) |

> El costo por participante **solo** define cuánto se cobra. Ya no se compara contra lo gastado (la comparativa "Presupuesto base" se eliminó en la migración 162).

### Participante con cuota distinta

Ejemplo: un scout va en transporte propio y no paga el pasaje (S/ 6), así que su cuota es S/ 7 en lugar de S/ 13.

**No** registrar un pago ficticio ni dejar la deuda: se **ajusta su cuota individual**.

1. Actividad › **Participantes** › **Editar** en su fila.
2. **Monto a pagar** = `7.00`.
3. **Observaciones**: el motivo (p. ej. *"Transporte propio, no paga pasaje S/ 6"*).

Resultado: queda como pagado completo, **Cuotas esperadas** y **Pendiente de cobro** bajan en S/ 6, y **Recaudado** y **Saldo** no cambian.

---

## 8. Reporte Financiero (PDF) — módulo Reportes

Ubicación: **Reportes › Reportes Estratégicos › Finanzas de Actividad (Aire Libre)** → elegir la actividad → PDF.

Código: [ReporteFinancieroTemplate.tsx](src/modules/reports/templates/pdf/anexos/ReporteFinancieroTemplate.tsx) · `generarReporteFinanciero` en [anexosAireLibreService.ts](src/modules/reports/services/anexosAireLibreService.ts) · selector en [ReportManager.tsx](src/modules/reports/components/ReportManager.tsx)

Fuentes: `obtenerActividad` (participantes y compras directas) + `api_obtener_detalle_presupuesto_actividad` (cada ítem planificado).

| Sección | Contenido / cálculo |
|---|---|
| Datos de la actividad | Nombre, estado, lugar, fechas, Nº participantes, cuota |
| **Resumen — cobros** | Cuotas esperadas · Recaudado · Pendiente de cobro (`max(esperadas − recaudado, 0)`) |
| **Resumen — gastos** | Presupuesto estimado · Total gastado · Ahorro/Sobrecosto vs estimado. Si hay pendientes por comprar: **Estimado por ejecutar** (`estimado − gastado`) en lugar de ahorro |
| **Saldo** | `Recaudado − Gastado` (a favor / en contra) |
| **Saldo proyectado** | Solo si hay pendientes: `Saldo − estimado de ítems pendientes` |
| Egresos por categoría | Estimado, Gastado y Diferencia (misma normalización que 3.3). "Sin presupuesto" si estimado = 0 y gastado > 0 |
| Ingresos | #, participante, cuota, pagado, pendiente; con totales |
| Ítems planificados comprados | Categoría, origen (plato / bloque / tipo de logística), concepto, cantidad real, P. unit. real, estimado, gastado, proveedor |
| Compras directas | Fecha, concepto, categoría, proveedor, comprobante (tipo + número), monto |
| Pendientes por comprar | Ítems `PENDIENTE` con su estimado |
| Firmas | Responsable de la actividad · Tesorería del Grupo |

Formato: cuando una tabla pasa de página, se cierra con borde en ambas hojas y el encabezado de columnas se repite; un título de sección no queda solo al pie de una hoja.

---

## 9. Qué pregunta responde cada número

| Pregunta | Dónde mirar |
|---|---|
| ¿Cuánto dinero entró? | **Recaudado** (arriba) |
| ¿Cuánto falta cobrar? | **Cuotas pendientes** (REPORTES) o **Pendiente de cobro** (PDF) |
| ¿Cuánto se gastó en total? | **Gastado** (arriba) o **Total gastado** (PRESUPUESTO) |
| ¿Cuánto sobra o falta en caja? | **Saldo** (arriba) |
| ¿Compré más caro o más barato de lo planeado? | **Ahorro / Sobrecosto** (PRESUPUESTO) y **Total Logística** |
| ¿Qué gastos no estaban planificados? | Categorías con badge **"Sin presupuesto"** (PRESUPUESTO) |
| ¿Cuánto del plan queda por gastar? | **Disponible** (COMPRAS) |
| ¿Cuánto debe pagar cada participante? | **Costo por participante** (paso Costos) o su cuota individual |
| ¿Necesito rendir cuentas con detalle? | **Reporte Financiero (PDF)** en el módulo Reportes |

---

## 10. Pendientes conocidos

- **Materiales sin precio real**: la pestaña solo cambia el estado; al marcar `COMPRADO` se asume el estimado. Falta conectar el diálogo **Registrar compra** (ya soporta materiales).

---

## 11. Migraciones relacionadas

Ejecutar en Supabase (SQL Editor), en este orden:

| Archivo | Cambio |
|---|---|
| [161_fix_dashboard_presupuesto_categorias.sql](database/161_fix_dashboard_presupuesto_categorias.sql) | Une compras directas con su categoría, normaliza nombres, quita duplicados, agrega `total_items` |
| [162_eliminar_presupuesto_base_dashboard.sql](database/162_eliminar_presupuesto_base_dashboard.sql) | Quita `presupuesto_base`, `diferencia_base_real` y `porcentaje_ejecucion_vs_base`; elimina la vista `v_presupuesto_consolidado_actividad` (versión base vs real) |
| [163_detalle_presupuesto_actividad.sql](database/163_detalle_presupuesto_actividad.sql) | Nueva función `api_obtener_detalle_presupuesto_actividad`: detalle por ítem para el Reporte Financiero y la exportación "Presupuesto" |
| [164_logistica_precio_real.sql](database/164_logistica_precio_real.sql) | `api_listar_logistica` devuelve el precio real; asegura `api_registrar_compra_logistica` |
| [165_logistica_estados_gastado.sql](database/165_logistica_estados_gastado.sql) | En la vista, Logística `EN_LUGAR` / `DEVUELTO` cuentan como gastado |

Cada migración termina con `NOTIFY pgrst, 'reload schema';` para que la API reconozca los cambios al instante.
