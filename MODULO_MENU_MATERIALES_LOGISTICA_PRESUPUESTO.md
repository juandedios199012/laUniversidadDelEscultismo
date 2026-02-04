# 📋 Módulo de Menú, Materiales, Logística y Presupuesto
## Sistema de Gestión Scout - Grupo Scout Lima 12

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Autor:** Equipo de Desarrollo

---

## 📖 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Técnica](#arquitectura-técnica)
   - [Diagrama de Componentes](#diagrama-de-componentes)
   - [Modelo de Datos](#modelo-de-datos)
   - [Flujo de Datos](#flujo-de-datos)
3. [Tablas de Base de Datos](#tablas-de-base-de-datos)
4. [Funciones RPC (API Backend)](#funciones-rpc-api-backend)
5. [Servicios Frontend](#servicios-frontend)
6. [Componentes React](#componentes-react)
7. [Flujo Funcional (Proceso de Negocio)](#flujo-funcional-proceso-de-negocio)
8. [Guía de Instalación](#guía-de-instalación)
9. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Resumen Ejecutivo

Este módulo permite la gestión completa del presupuesto de actividades al aire libre (campamentos, excursiones, etc.) con las siguientes funcionalidades:

### ✅ Funcionalidades Principales

| Área | Descripción |
|------|-------------|
| **Menú** | Gestión de platos y sus ingredientes con costos unitarios |
| **Materiales** | Materiales por bloque de actividad del programa |
| **Logística** | Items transversales (mesas, toldos, carpas, transporte) |
| **Presupuesto** | Dashboard consolidado con estimado vs. real |
| **Compras** | Registro de precio real con diferencia calculada |
| **Vouchers** | Adjunto opcional de comprobantes (boletas, facturas) |

### 🎯 Flujo Simplificado

```
PLANIFICACIÓN              EJECUCIÓN                  ANÁLISIS
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│  Ingrediente │    ───►  │   COMPRADO  │    ───►  │  Dashboard  │
│  P.Unit: S/5 │          │ P.Real: S/6 │          │ Δ +S/1.00   │
│  Est: S/25   │          │ Real: S/30  │          │ Sobrecosto  │
└─────────────┘           └─────────────┘           └─────────────┘
      ▲                         │
      │                         ▼
      │                   ┌─────────────┐
      │                   │   Voucher   │  (OPCIONAL)
      │                   │  Boleta PDF │
      │                   └─────────────┘
```

---

## Arquitectura Técnica

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ ActividadDetalle │──│  IngredientesMenu │──│RegistrarCompra│ │
│  │   (Container)    │  │   (List + CRUD)   │  │   Dialog     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│           │                    │                    │          │
│           │            ┌───────┴───────┐            │          │
│           │            │               │            │          │
│  ┌────────┴────────┐   │   ┌───────────┴───────┐   │          │
│  │ MaterialesBloque│   │   │ PresupuestoDashboard│  │          │
│  │  (Per Bloque)   │   │   │   (KPIs + Charts)   │  │          │
│  └─────────────────┘   │   └────────────────────┘  │          │
│                        │                            │          │
│  ┌─────────────────┐   │                            │          │
│  │   LogisticaTab  │───┘                            │          │
│  │  (Transversal)  │                                │          │
│  └─────────────────┘                                │          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           actividadesExteriorService.ts                     ││
│  │  • listarIngredientesMenu()                                 ││
│  │  • registrarCompraIngrediente()                             ││
│  │  • subirVoucher()                                           ││
│  │  • obtenerDashboardPresupuesto()                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
└──────────────────────────────│──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Supabase)                        │
├─────────────────────────────────────────────────────────────────┤
│  RPC Functions:                                                 │
│  • api_agregar_ingrediente_menu                                 │
│  • api_registrar_compra_ingrediente                             │
│  • api_subir_voucher                                            │
│  • api_obtener_dashboard_presupuesto                            │
│                                                                 │
│  Tables:                                                        │
│  • ingredientes_menu                                            │
│  • materiales_bloque                                            │
│  • logistica_actividad                                          │
│  • vouchers_compra                                              │
│                                                                 │
│  Views:                                                         │
│  • v_presupuesto_consolidado_actividad                          │
│  • v_presupuesto_vs_real_actividad                              │
└─────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos (Diagrama ER)

```
┌────────────────────┐       ┌────────────────────┐
│  menu_actividad    │       │ bloques_programa   │
│  (platos)          │       │ (del programa)     │
├────────────────────┤       ├────────────────────┤
│ id (PK)            │       │ id (PK)            │
│ actividad_id (FK)  │       │ programa_id (FK)   │
│ nombre_plato       │       │ nombre             │
│ tipo_comida        │       │ descripcion        │
└────────┬───────────┘       └────────┬───────────┘
         │ 1:N                        │ 1:N
         ▼                            ▼
┌────────────────────┐       ┌────────────────────┐
│ ingredientes_menu  │       │ materiales_bloque  │
├────────────────────┤       ├────────────────────┤
│ id (PK)            │       │ id (PK)            │
│ menu_id (FK)       │       │ bloque_id (FK)     │
│ nombre             │       │ nombre             │
│ unidad             │       │ categoria          │
│ cantidad           │       │ cantidad           │
│ precio_unitario    │       │ precio_unitario    │
│ subtotal (GEN)     │       │ subtotal (GEN)     │
│ estado_compra      │       │ estado             │
│ ----------- REAL --│       │ ----------- REAL --│
│ cantidad_comprada  │       │ cantidad_comprada  │
│ precio_unit_real   │       │ precio_unit_real   │
│ subtotal_real (GEN)│       │ subtotal_real (GEN)│
│ diferencia (GEN)   │       │ diferencia (GEN)   │
│ lugar_compra       │       │ lugar_compra       │
└────────┬───────────┘       └────────┬───────────┘
         │                            │
         └──────────┬─────────────────┘
                    │ N:1
                    ▼
          ┌────────────────────┐
          │  vouchers_compra   │
          ├────────────────────┤
          │ id (PK)            │
          │ actividad_id (FK)  │
          │ tipo_item          │  (ingrediente|material|logistica)
          │ item_id (FK)       │
          │ nombre_archivo     │
          │ url_archivo        │
          │ tipo_comprobante   │  (BOLETA|FACTURA|TICKET|...)
          │ numero_comprobante │
          │ monto_comprobante  │
          └────────────────────┘
```

### Flujo de Datos

```
Usuario                    Frontend                    Backend
   │                          │                           │
   │  Agregar ingrediente     │                           │
   ├─────────────────────────►│                           │
   │                          │  api_agregar_ingrediente  │
   │                          ├──────────────────────────►│
   │                          │       { id, subtotal }    │
   │                          │◄──────────────────────────┤
   │      Tabla actualizada   │                           │
   │◄─────────────────────────┤                           │
   │                          │                           │
   │  Cambiar a "COMPRADO"    │                           │
   ├─────────────────────────►│                           │
   │     Modal Compra         │                           │
   │◄─────────────────────────┤                           │
   │                          │                           │
   │  Precio real + voucher   │                           │
   ├─────────────────────────►│  api_registrar_compra     │
   │                          ├──────────────────────────►│
   │                          │  { subtotal_real, diff }  │
   │                          │◄──────────────────────────┤
   │                          │                           │
   │                          │  api_subir_voucher        │
   │                          ├──────────────────────────►│
   │                          │         OK                │
   │                          │◄──────────────────────────┤
   │      Compra registrada   │                           │
   │◄─────────────────────────┤                           │
   │                          │                           │
   │  Ver Dashboard           │  api_obtener_dashboard    │
   ├─────────────────────────►├──────────────────────────►│
   │                          │  { totales, categorías }  │
   │      KPIs + Gráficos     │◄──────────────────────────┤
   │◄─────────────────────────┤                           │
```

---

## Tablas de Base de Datos

### 1. `ingredientes_menu`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `menu_id` | UUID | Referencia al plato (FK) |
| `nombre` | VARCHAR(100) | Nombre del ingrediente |
| `unidad` | VARCHAR(20) | Unidad de medida (kg, L, unidad, etc.) |
| `cantidad` | NUMERIC(10,3) | Cantidad estimada |
| `precio_unitario` | NUMERIC(10,2) | Precio unitario estimado |
| `subtotal` | NUMERIC(12,2) | **GENERATED** = cantidad × precio_unitario |
| `estado_compra` | VARCHAR(20) | PENDIENTE, EN_LISTA, COTIZADO, COMPRADO, RECIBIDO |
| `cantidad_comprada` | NUMERIC(10,3) | Cantidad real comprada |
| `precio_unitario_real` | NUMERIC(10,2) | Precio real de compra |
| `subtotal_real` | NUMERIC(12,2) | **GENERATED** = cantidad_comprada × precio_real |
| `diferencia` | NUMERIC(12,2) | **GENERATED** = subtotal_real - subtotal |
| `lugar_compra` | VARCHAR(100) | Mercado, tienda, etc. |
| `notas_compra` | TEXT | Observaciones de la compra |

### 2. `materiales_bloque`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `bloque_id` | UUID | Referencia al bloque del programa (FK) |
| `nombre` | VARCHAR(100) | Nombre del material |
| `categoria` | VARCHAR(30) | MATERIAL, HERRAMIENTA, PAPELERIA, etc. |
| `cantidad` | NUMERIC(10,3) | Cantidad estimada |
| `precio_unitario` | NUMERIC(10,2) | Precio unitario estimado |
| `subtotal` | NUMERIC(12,2) | **GENERATED** |
| `estado` | VARCHAR(20) | PENDIENTE, EN_INVENTARIO, COTIZADO, COMPRADO, ASIGNADO |
| *(campos de compra real igual que ingredientes)* |

### 3. `logistica_actividad`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `actividad_id` | UUID | Referencia a la actividad (FK) |
| `nombre` | VARCHAR(100) | Nombre del item (Mesa, Toldo, etc.) |
| `categoria` | VARCHAR(30) | MOBILIARIO, TRANSPORTE, COCINA, CAMPING, etc. |
| `cantidad` | INTEGER | Cantidad necesaria |
| `precio_unitario` | NUMERIC(10,2) | Precio/alquiler estimado |
| `subtotal` | NUMERIC(12,2) | **GENERATED** |
| `estado` | VARCHAR(20) | PENDIENTE, RESERVADO, CONFIRMADO, ENTREGADO |
| *(campos de compra real igual que ingredientes)* |

### 4. `vouchers_compra`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `actividad_id` | UUID | Referencia a la actividad (FK) |
| `tipo_item` | VARCHAR(20) | ingrediente, material, logistica |
| `item_id` | UUID | Referencia al item específico |
| `nombre_archivo` | VARCHAR(255) | Nombre original del archivo |
| `url_archivo` | TEXT | URL en Supabase Storage |
| `tipo_comprobante` | VARCHAR(20) | BOLETA, FACTURA, TICKET, RECIBO, SIN_COMPROBANTE |
| `numero_comprobante` | VARCHAR(50) | Número del comprobante |
| `ruc_proveedor` | VARCHAR(11) | RUC del vendedor |
| `razon_social_proveedor` | VARCHAR(200) | Razón social |
| `fecha_emision` | DATE | Fecha del comprobante |
| `monto_comprobante` | NUMERIC(10,2) | Monto total del comprobante |

### 5. Catálogos

- **`catalogo_unidades`**: kg, L, unidad, docena, atado, bolsa, sobre, lata, botella
- **`catalogo_categorias_material`**: MATERIAL, HERRAMIENTA, PAPELERIA, DECORACION, PREMIO, TECNICO, SCOUTICO, DEPORTIVO
- **`catalogo_categorias_logistica`**: MOBILIARIO, TRANSPORTE, COCINA, CAMPING, HERRAMIENTAS, SEGURIDAD, DECORACION

---

## Funciones RPC (API Backend)

### Ingredientes

| Función | Parámetros | Retorno | Descripción |
|---------|------------|---------|-------------|
| `api_agregar_ingrediente_menu` | menu_id, datos (JSON) | ingrediente creado | Agrega nuevo ingrediente |
| `api_actualizar_ingrediente_menu` | ingrediente_id, datos (JSON) | ingrediente actualizado | Modifica ingrediente |
| `api_eliminar_ingrediente_menu` | ingrediente_id | boolean | Elimina ingrediente |
| `api_listar_ingredientes_menu` | menu_id | JSON[] | Lista ingredientes de un plato |
| `api_registrar_compra_ingrediente` | ingrediente_id, compra (JSON) | ingrediente actualizado | Registra compra con precio real |

### Materiales

| Función | Parámetros | Retorno | Descripción |
|---------|------------|---------|-------------|
| `api_agregar_material_bloque` | bloque_id, datos (JSON) | material creado | Agrega nuevo material |
| `api_actualizar_material_bloque` | material_id, datos (JSON) | material actualizado | Modifica material |
| `api_eliminar_material_bloque` | material_id | boolean | Elimina material |
| `api_listar_materiales_bloque` | bloque_id | JSON[] | Lista materiales de un bloque |
| `api_registrar_compra_material` | material_id, compra (JSON) | material actualizado | Registra compra con precio real |

### Logística

| Función | Parámetros | Retorno | Descripción |
|---------|------------|---------|-------------|
| `api_agregar_logistica_actividad` | actividad_id, datos (JSON) | item creado | Agrega item de logística |
| `api_actualizar_logistica_actividad` | item_id, datos (JSON) | item actualizado | Modifica item |
| `api_eliminar_logistica_actividad` | item_id | boolean | Elimina item |
| `api_listar_logistica_actividad` | actividad_id | JSON[] | Lista logística de actividad |
| `api_registrar_compra_logistica` | item_id, compra (JSON) | item actualizado | Registra compra con precio real |

### Vouchers

| Función | Parámetros | Retorno | Descripción |
|---------|------------|---------|-------------|
| `api_subir_voucher` | datos (JSON) | voucher creado | Registra un comprobante |
| `api_listar_vouchers_item` | tipo_item, item_id | JSON[] | Lista vouchers de un item |
| `api_eliminar_voucher` | voucher_id | boolean | Elimina voucher |

### Dashboard

| Función | Parámetros | Retorno | Descripción |
|---------|------------|---------|-------------|
| `api_obtener_dashboard_presupuesto` | actividad_id | JSON | Dashboard consolidado |

**Ejemplo de respuesta `api_obtener_dashboard_presupuesto`:**

```json
{
  "total_estimado": 1500.00,
  "total_real": 1423.50,
  "diferencia_global": -76.50,
  "ahorro": 76.50,
  "sobrecosto": 0,
  "items_pendientes": 5,
  "items_comprados": 23,
  "total_items": 28,
  "porcentaje_avance": 82.14,
  "por_categoria": [
    {
      "categoria": "MENU",
      "total_estimado": 800.00,
      "total_real": 756.00,
      "diferencia": -44.00,
      "items_count": 15,
      "items_comprados": 12
    },
    {
      "categoria": "MATERIALES",
      "total_estimado": 400.00,
      "total_real": 420.50,
      "diferencia": 20.50,
      "items_count": 8,
      "items_comprados": 7
    },
    {
      "categoria": "LOGISTICA",
      "total_estimado": 300.00,
      "total_real": 247.00,
      "diferencia": -53.00,
      "items_count": 5,
      "items_comprados": 4
    }
  ],
  "vouchers": [...]
}
```

---

## Servicios Frontend

### Ubicación
```
src/services/actividadesExteriorService.ts
```

### Interfaces Principales

```typescript
// Ingrediente con campos de compra real
export interface IngredienteMenu {
  id: string;
  menu_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado_compra: EstadoCompraIngrediente;
  // Campos de compra real
  cantidad_comprada?: number;
  precio_unitario_real?: number;
  subtotal_real?: number;
  diferencia?: number;
  lugar_compra?: string;
  notas_compra?: string;
  vouchers?: VoucherCompra[];
}

// Datos para registrar compra
export interface RegistroCompraIngrediente {
  precio_unitario_real: number;
  cantidad_comprada?: number;
  lugar_compra?: string;
  proveedor?: string;
  notas_compra?: string;
}

// Voucher (opcional)
export interface VoucherCompra {
  id: string;
  actividad_id: string;
  tipo_item: TipoItemVoucher;
  item_id: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_comprobante: TipoComprobante;
  numero_comprobante?: string;
  monto_comprobante?: number;
}

// Dashboard consolidado
export interface DashboardPresupuesto {
  total_estimado: number;
  total_real: number;
  diferencia_global: number;
  ahorro: number;
  sobrecosto: number;
  items_pendientes: number;
  items_comprados: number;
  total_items: number;
  porcentaje_avance: number;
  por_categoria: DashboardPresupuestoCategoria[];
  vouchers?: VoucherCompra[];
}
```

### Métodos Principales

```typescript
// INGREDIENTES
static async listarIngredientesMenu(menuId: string): Promise<IngredienteMenu[]>
static async agregarIngredienteMenu(menuId: string, datos: NuevoIngrediente): Promise<IngredienteMenu>
static async actualizarIngredienteMenu(id: string, datos: Partial<IngredienteMenu>): Promise<IngredienteMenu>
static async eliminarIngredienteMenu(id: string): Promise<void>

// COMPRAS
static async registrarCompraIngrediente(id: string, compra: RegistroCompraIngrediente): Promise<IngredienteMenu>
static async registrarCompraMaterial(id: string, compra: RegistroCompraMaterial): Promise<MaterialBloque>
static async registrarCompraLogistica(id: string, compra: RegistroCompraLogistica): Promise<LogisticaActividad>

// VOUCHERS
static async subirVoucher(actividadId: string, voucher: NuevoVoucher, archivo?: File): Promise<VoucherCompra>
static async listarVouchersItem(tipoItem: TipoItemVoucher, itemId: string): Promise<VoucherCompra[]>
static async eliminarVoucher(id: string): Promise<void>

// DASHBOARD
static async obtenerDashboardPresupuesto(actividadId: string): Promise<DashboardPresupuesto>
```

---

## Componentes React

### Ubicación
```
src/components/ActividadesExterior/
├── ActividadDetalle.tsx           # Container principal
├── components/
│   ├── IngredientesMenu.tsx       # Lista de ingredientes por plato
│   ├── MaterialesBloque.tsx       # Materiales por bloque de programa
│   ├── LogisticaTab.tsx           # Tab de logística transversal
│   └── PresupuestoDashboard.tsx   # Dashboard consolidado
└── dialogs/
    └── RegistrarCompraItemDialog.tsx  # Modal para registrar compra
```

### `IngredientesMenu.tsx`

**Props:**
```typescript
interface IngredientesMenuProps {
  menuId: string;           // ID del plato
  menuNombre: string;       // Nombre para mostrar
  actividadId: string;      // ID de la actividad (para vouchers)
  readonly?: boolean;       // Modo solo lectura
  onTotalChange?: (total: number, totalReal?: number) => void;
}
```

**Características:**
- Tabla con columnas: Ingrediente, Unidad, Cantidad, P.Unit, Subtotal, P.Real, Estado
- Edición inline de campos básicos
- Selector de estado con trigger a modal de compra
- Badge de ahorro/sobrecosto en columna P.Real
- Footer con totales estimado y real

### `RegistrarCompraItemDialog.tsx`

**Props:**
```typescript
interface RegistrarCompraItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemParaComprar | null;   // Datos del item
  tipoItem: 'ingrediente' | 'material' | 'logistica';
  actividadId: string;
  onSuccess: () => void;
}
```

**Campos del formulario:**
1. **Precio Unitario Real** (requerido)
2. **Cantidad Comprada** (opcional, default = estimada)
3. **Lugar de Compra** (opcional)
4. **Proveedor** (opcional)
5. **Notas** (opcional)
6. **Adjuntar Voucher** (checkbox, opcional)
   - Archivo (drag & drop, imagen o PDF, máx 10MB)
   - Tipo de comprobante (BOLETA, FACTURA, TICKET, RECIBO, SIN_COMPROBANTE)
   - Número de comprobante
   - Monto total

**Comportamiento:**
- Muestra comparación Estimado → Real en tiempo real
- Calcula diferencia y muestra indicador visual (verde = ahorro, rojo = sobrecosto)
- Validación con Zod
- Al guardar: registra compra + sube voucher (si corresponde)

### `PresupuestoDashboard.tsx`

**Props:**
```typescript
interface PresupuestoDashboardProps {
  actividadId: string;
  actividadNombre: string;
}
```

**Secciones:**
1. **KPIs principales** (4 cards):
   - Total Estimado
   - Total Real
   - Ahorro/Sobrecosto
   - Barra de avance

2. **Desglose por categoría** (Accordion):
   - MENU: Total, avance, diferencia
   - MATERIALES: Total, avance, diferencia
   - LOGÍSTICA: Total, avance, diferencia

3. **Tabla de vouchers** (si hay):
   - Tipo, Número, Proveedor, Monto, Fecha

4. **Resumen final**:
   - Estado (en progreso / completado)
   - Balance final

---

## Flujo Funcional (Proceso de Negocio)

### 👤 Roles Involucrados

| Rol | Responsabilidad |
|-----|-----------------|
| **Intendente** | Planifica menú, estima precios, registra compras reales |
| **Jefe de Programa** | Asigna materiales por bloque de actividad |
| **Jefe de Logística** | Gestiona items transversales (mesas, transporte, etc.) |
| **Tesorero** | Revisa dashboard de presupuesto y vouchers |

### 📋 Proceso Paso a Paso

#### FASE 1: Planificación (Antes de la Actividad)

**1.1 Planificar Menú**
```
1. Ir a Actividad → Tab "Menú"
2. Agregar platos (Desayuno Día 1, Almuerzo Día 1, etc.)
3. Para cada plato, expandir y agregar ingredientes:
   - Arroz: 5 kg × S/ 3.50 = S/ 17.50
   - Pollo: 3 kg × S/ 12.00 = S/ 36.00
   - Aceite: 1 L × S/ 8.00 = S/ 8.00
   Total plato: S/ 61.50
```

**1.2 Asignar Materiales por Bloque**
```
1. Ir a Actividad → Tab "Programa" → Expandir bloque
2. Agregar materiales necesarios:
   - Cartulinas (10 unidades × S/ 0.50)
   - Plumones (1 caja × S/ 15.00)
   - Cuerdas (5 metros × S/ 2.00)
```

**1.3 Registrar Logística**
```
1. Ir a Actividad → Tab "Logística"
2. Agregar items transversales:
   - Mesa plegable (2 × S/ 50.00 alquiler)
   - Toldo 3x3m (1 × S/ 80.00 alquiler)
   - Bus (1 × S/ 400.00)
```

#### FASE 2: Ejecución (Durante la Compra)

**2.1 Registrar Compra con Precio Real**
```
1. Ir a Tab "Menú" → Expandir plato
2. Cambiar estado del ingrediente a "COMPRADO"
3. Se abre modal de Registro de Compra:
   
   ┌─────────────────────────────────────────────┐
   │  Registrar Compra: Arroz                    │
   ├─────────────────────────────────────────────┤
   │  Estimado: 5 kg × S/ 3.50 = S/ 17.50       │
   │                                             │
   │  Precio Real: [S/ 4.00] ▲                   │
   │  Cantidad:    [5] kg                        │
   │  Lugar:       [Mercado Central]             │
   │                                             │
   │  Real: 5 kg × S/ 4.00 = S/ 20.00           │
   │  ⚠️ Sobrecosto: +S/ 2.50                    │
   │                                             │
   │  ☐ Adjuntar Voucher (opcional)              │
   │                                             │
   │  [Cancelar]              [Registrar Compra] │
   └─────────────────────────────────────────────┘
```

**2.2 Adjuntar Voucher (Opcional)**
```
Si marca "Adjuntar Voucher":

   │  ☑ Adjuntar Voucher                         │
   │  ┌─────────────────────────────────────┐   │
   │  │ [🖼️ foto_boleta.jpg]              X │   │
   │  │ 245 KB                               │   │
   │  └─────────────────────────────────────┘   │
   │  Tipo: [Boleta ▼]                          │
   │  Número: [B001-00123]                      │
   │  Monto: [S/ 20.00]                         │

Nota: El voucher es OPCIONAL. A veces no dan comprobante.
```

#### FASE 3: Análisis (Durante/Después)

**3.1 Revisar Dashboard de Presupuesto**
```
1. Ir a Actividad → Tab "Presupuesto"
2. Ver KPIs consolidados:

   ┌──────────────┬──────────────┬──────────────┬──────────────┐
   │  Estimado    │    Real      │   Ahorro     │   Avance     │
   │  S/ 1,500    │  S/ 1,424    │   S/ 76      │   ████▓ 85%  │
   └──────────────┴──────────────┴──────────────┴──────────────┘

3. Ver desglose por categoría:
   
   ▼ 🍽️ MENÚ - S/ 800 estimado
     Real: S/ 756.00 | Ahorro: S/ 44.00
     ████████░░ 80%
   
   ▼ 📦 MATERIALES - S/ 400 estimado
     Real: S/ 420.50 | Sobrecosto: S/ 20.50
     ████████░░ 87%
   
   ▼ 🚛 LOGÍSTICA - S/ 300 estimado
     Real: S/ 247.00 | Ahorro: S/ 53.00
     █████████░ 90%
```

### 🔄 Diagrama de Estados

```
INGREDIENTE:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ PENDIENTE│───►│ EN_LISTA │───►│ COTIZADO │───►│ COMPRADO │───►│ RECIBIDO │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
                                               [Registra precio real]
                                               [Adjunta voucher?]

LOGÍSTICA:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ PENDIENTE│───►│ RESERVADO│───►│CONFIRMADO│───►│ ENTREGADO│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                      │
                                      ▼
                               [Registra precio real]
```

---

## Guía de Instalación

### Requisitos Previos

1. Base de datos Supabase configurada
2. Storage bucket `vouchers` creado en Supabase
3. Frontend React con dependencias instaladas

### Paso 1: Ejecutar Migraciones SQL

```bash
# En Supabase SQL Editor, ejecutar en orden:

# 1. Tablas base, catálogos y funciones
70_menu_materiales_logistica_presupuesto.sql

# 2. Campos de precio real y vouchers
71_compras_vouchers_precio_real.sql
```

### Paso 2: Configurar Storage

```sql
-- Crear bucket para vouchers (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO NOTHING;

-- Política para subir archivos
CREATE POLICY "Usuarios pueden subir vouchers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vouchers');
```

### Paso 3: Verificar Frontend

```bash
# Reiniciar servidor de desarrollo
pkill -f vite && npm run dev

# Verificar en consola que no hay errores de importación
```

### Paso 4: Probar Flujo

1. Crear o editar una actividad
2. Ir a Tab "Menú" y agregar un plato
3. Expandir el plato y agregar ingredientes
4. Cambiar estado a "COMPRADO"
5. Verificar que se abre el modal
6. Ingresar precio real y guardar
7. Ir a Tab "Presupuesto" y verificar totales

---

## Preguntas Frecuentes

### ¿Por qué el voucher es opcional?

En el contexto scout peruano, muchas compras se realizan en mercados informales o pequeños comercios que no siempre emiten comprobantes. La política es registrar el precio real siempre, pero el voucher solo cuando se obtiene uno.

### ¿Cómo se calcula la diferencia?

```
diferencia = subtotal_real - subtotal_estimado

Si diferencia < 0 → Ahorro (se gastó menos)
Si diferencia > 0 → Sobrecosto (se gastó más)
Si diferencia = 0 → Exacto
```

### ¿Puedo editar una compra ya registrada?

Sí, solo cambia el estado a otro valor y vuelve a seleccionar "COMPRADO". Se abrirá el modal con los valores anteriores pre-cargados.

### ¿Dónde se almacenan los vouchers?

En Supabase Storage, bucket `finanzas` (compartido con el módulo de Finanzas), con la estructura:
```
finanzas/                          (1 solo bucket para todo el sistema)
├── evidencias/                    # Módulo Finanzas
│   └── {timestamp}_{archivo}
├── actividades/                   # Documentos de actividades
│   └── {actividadId}/
│       └── {timestamp}_{archivo}
└── vouchers/                      # Comprobantes de compras (este módulo)
    └── {actividadId}/
        └── {tipoItem}_{itemId}_{timestamp}.ext
```

> **💡 Nota de Costos:** Se usa un solo bucket para minimizar costos de Supabase Storage (500MB gratis).

### ¿Qué pasa si elimino un ingrediente con voucher?

El voucher se elimina automáticamente (CASCADE) junto con el registro en storage.

---

## 🗑️ Arquitectura de Eliminación de Archivos (Storage Cleanup)

### Patrón Implementado: BD Primero + Limpieza Best-Effort

```
Usuario hace clic en "Eliminar Voucher"
         ↓
    ┌────────────────────────────────────┐
    │  1. Elimina registro de la BD      │  ← api_eliminar_voucher()
    │  2. Devuelve URL del archivo       │     (fuente de verdad)
    └────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │  3. Frontend elimina archivo       │  ← supabase.storage.remove()
    │     del bucket "finanzas"          │     (best-effort)
    └────────────────────────────────────┘
         ↓
    ✅ Toast: "Voucher eliminado"
```

### ¿Por qué este enfoque?

| Paso | Importancia | Si falla... |
|------|-------------|-------------|
| 1. Eliminar de BD | **CRÍTICO** | Operación falla, nada se elimina |
| 2. Eliminar de Storage | Secundario | Se loguea error, archivo queda huérfano |

**La BD es la fuente de verdad.** Si el archivo queda huérfano en storage, no afecta la integridad del sistema.

### Flujo en el Código

```typescript
// actividadesExteriorService.ts
static async eliminarVoucher(voucherId: string): Promise<void> {
  // 1. Eliminar de BD y obtener URL
  const { data } = await supabase.rpc('api_eliminar_voucher', { p_id: voucherId });
  
  // 2. Limpiar archivo del storage (best-effort)
  if (data.url_archivo) {
    try {
      const storagePath = new URL(data.url_archivo).pathname.split('/finanzas/')[1];
      await supabase.storage.from('finanzas').remove([storagePath]);
    } catch (e) {
      console.warn('Error limpiando storage (archivo huérfano):', e);
      // No fallar - la operación principal fue exitosa
    }
  }
}
```

### Casos Edge: Archivos Huérfanos

Pueden quedar archivos huérfanos en estos casos:
1. **Error de red** al eliminar del storage después de eliminar de BD
2. **Eliminación en cascada** (DELETE actividad → vouchers se borran de BD pero storage queda)

### Limpieza Manual (Administrador)

Para limpiar archivos huérfanos ocasionalmente:

1. Ir a **Supabase Dashboard → Storage → finanzas → vouchers/**
2. Revisar carpetas de actividades
3. Comparar con actividades existentes en BD
4. Eliminar carpetas de actividades que ya no existen

> **Frecuencia recomendada:** Mensual o cuando se note uso excesivo de storage.

### Para Usuario Final

**No tienen que hacer nada extra.** El sistema se encarga automáticamente:
- Eliminar voucher → Se borra de BD + Storage
- Eliminar transacción con evidencias → Se borra todo
- El usuario solo ve: "Voucher eliminado" ✅

---

## Changelog

### v1.0.0 (Enero 2026)
- ✅ Tabla `ingredientes_menu` con campos de presupuesto
- ✅ Tabla `materiales_bloque` por bloque de programa
- ✅ Tabla `logistica_actividad` transversal
- ✅ Tabla `vouchers_compra` con soporte para archivos
- ✅ Columnas GENERATED para subtotales y diferencias
- ✅ Funciones RPC para CRUD completo
- ✅ Función `api_obtener_dashboard_presupuesto`
- ✅ Componente `IngredientesMenu` con edición inline
- ✅ Componente `MaterialesBloque` por bloque
- ✅ Componente `LogisticaTab` transversal
- ✅ Modal `RegistrarCompraItemDialog`
- ✅ Dashboard `PresupuestoDashboard` consolidado
- ✅ Integración en `ActividadDetalle`

### v1.0.1 (Febrero 2026)
- ✅ Corregido bucket de storage: usa `finanzas` (compartido)
- ✅ `api_eliminar_voucher` ahora devuelve `url_archivo` para limpieza
- ✅ Frontend elimina archivo de storage después de BD
- ✅ Documentación de arquitectura de eliminación de archivos

**Documentación generada con GitHub Copilot**  
**Sistema de Gestión Scout - Grupo Scout Lima 12**
