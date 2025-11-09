# 📦 Inventario API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Inventario gestiona todos los materiales, equipos y recursos del grupo scout, incluyendo préstamos, movimientos, mantenimiento y estadísticas. Contiene **~25 funciones** para la gestión completa del inventario.

**Archivo:** `database/05_functions_inventario.sql`

---

## 🔧 **Funciones Principales**

### **📦 GESTIÓN DE ITEMS**

#### **1. Registrar Item de Inventario**
```sql
registrar_item_inventario(
  p_nombre VARCHAR(200),
  p_categoria VARCHAR(100),
  p_descripcion TEXT,
  p_cantidad_total INTEGER,
  p_ubicacion VARCHAR(150),
  p_estado item_estado_enum DEFAULT 'DISPONIBLE',
  p_valor_unitario DECIMAL(10,2) DEFAULT 0,
  p_metadata JSON DEFAULT '{}'
) RETURNS JSON
```

**Parámetros:**
- `p_nombre` - Nombre descriptivo del item
- `p_categoria` - Categoría: 'CAMPISMO', 'PRIMEROS_AUXILIOS', 'ACTIVIDADES', 'UNIFORMES', 'OFICINA', 'MANTENIMIENTO'
- `p_descripcion` - Descripción detallada
- `p_cantidad_total` - Cantidad disponible
- `p_ubicacion` - Ubicación física del item
- `p_estado` - Estado: 'DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA'
- `p_valor_unitario` - Valor económico por unidad
- `p_metadata` - Información adicional en JSON

**Ejemplo:**
```sql
SELECT registrar_item_inventario(
  p_nombre := 'Carpa 4 personas Coleman',
  p_categoria := 'CAMPISMO',
  p_descripcion := 'Carpa familiar resistente al agua, incluye sobretecho',
  p_cantidad_total := 5,
  p_ubicacion := 'Almacén Principal - Estante A3',
  p_valor_unitario := 450.00,
  p_metadata := '{
    "marca": "Coleman",
    "modelo": "Sundome 4",
    "año_compra": "2024",
    "garantia_hasta": "2026-01-01",
    "responsable_compra": "Juan Pérez"
  }'::json
);
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "item_id": "123e4567-e89b-12d3-a456-426614174000",
    "codigo_item": "INV2024001",
    "nombre": "Carpa 4 personas Coleman",
    "categoria": "CAMPISMO",
    "cantidad_disponible": 5,
    "ubicacion": "Almacén Principal - Estante A3",
    "valor_total": 2250.00
  },
  "message": "Item registrado exitosamente en inventario"
}
```

#### **2. Actualizar Item de Inventario**
```sql
actualizar_item_inventario(
  p_item_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

**Ejemplo:**
```sql
SELECT actualizar_item_inventario(
  p_item_id := '123e4567-e89b-12d3-a456-426614174000',
  p_datos_actualizacion := '{
    "cantidad_total": 6,
    "ubicacion": "Almacén Principal - Estante B1",
    "valor_unitario": 475.00
  }'::json
);
```

#### **3. Obtener Item por ID**
```sql
obtener_item_inventario(p_item_id UUID) RETURNS JSON
```

#### **4. Buscar Items por Criterio**
```sql
buscar_items_inventario(
  p_filtros JSON DEFAULT '{}',
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

**Filtros disponibles:**
```json
{
  "categoria": "CAMPISMO",
  "estado": "DISPONIBLE",
  "ubicacion": "Almacén Principal",
  "texto_busqueda": "carpa",
  "valor_minimo": 100.00,
  "valor_maximo": 1000.00,
  "disponible_cantidad_minima": 1
}
```

---

### **🔄 MOVIMIENTOS DE INVENTARIO**

#### **5. Registrar Movimiento de Inventario**
```sql
registrar_movimiento_inventario(
  p_item_id UUID,
  p_tipo_movimiento movimiento_tipo_enum,
  p_cantidad INTEGER,
  p_motivo TEXT,
  p_responsable_id UUID,
  p_detalles JSON DEFAULT '{}'
) RETURNS JSON
```

**Tipos de movimiento:**
- `ENTRADA` - Ingreso de items (compra, donación, devolución)
- `SALIDA` - Egreso de items (préstamo, baja, pérdida)
- `AJUSTE` - Ajuste de inventario
- `TRANSFERENCIA` - Cambio de ubicación

**Ejemplo:**
```sql
SELECT registrar_movimiento_inventario(
  p_item_id := '123e4567-e89b-12d3-a456-426614174000',
  p_tipo_movimiento := 'SALIDA',
  p_cantidad := 2,
  p_motivo := 'Préstamo para campamento Lobatos',
  p_responsable_id := 'dir123-456-789',
  p_detalles := '{
    "actividad": "Campamento de Invierno 2024",
    "fecha_devolucion_estimada": "2024-07-15",
    "scout_responsable": "Juan Pérez - Jefe de Patrulla Águilas"
  }'::json
);
```

#### **6. Obtener Historial de Movimientos**
```sql
obtener_historial_movimientos(
  p_item_id UUID DEFAULT NULL,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_tipo_movimiento movimiento_tipo_enum DEFAULT NULL
) RETURNS JSON
```

#### **7. Revertir Movimiento**
```sql
revertir_movimiento_inventario(
  p_movimiento_id UUID,
  p_motivo_reversion TEXT
) RETURNS JSON
```

---

### **📋 PRÉSTAMOS Y DEVOLUCIONES**

#### **8. Crear Préstamo**
```sql
crear_prestamo_inventario(
  p_items_prestamo JSON,
  p_solicitante_id UUID,
  p_responsable_prestamo_id UUID,
  p_fecha_devolucion_estimada DATE,
  p_motivo TEXT,
  p_condiciones_prestamo TEXT DEFAULT NULL
) RETURNS JSON
```

**Estructura de items_prestamo:**
```json
[
  {
    "item_id": "123e4567-e89b-12d3-a456-426614174000",
    "cantidad": 2,
    "observaciones": "Revisar estado del cierre"
  },
  {
    "item_id": "456e7890-e89b-12d3-a456-426614174001",
    "cantidad": 1,
    "observaciones": "Item en perfecto estado"
  }
]
```

**Ejemplo:**
```sql
SELECT crear_prestamo_inventario(
  p_items_prestamo := '[
    {"item_id": "123e4567-e89b-12d3-a456-426614174000", "cantidad": 2},
    {"item_id": "456e7890-e89b-12d3-a456-426614174001", "cantidad": 1}
  ]'::json,
  p_solicitante_id := 'scout789-123-456',
  p_responsable_prestamo_id := 'dir456-789-123',
  p_fecha_devolucion_estimada := '2024-07-15',
  p_motivo := 'Campamento de verano Tropa Scout',
  p_condiciones_prestamo := 'Devolver limpio y en buen estado'
);
```

#### **9. Registrar Devolución**
```sql
registrar_devolucion_prestamo(
  p_prestamo_id UUID,
  p_items_devueltos JSON,
  p_observaciones_devolucion TEXT DEFAULT NULL,
  p_responsable_recepcion_id UUID
) RETURNS JSON
```

#### **10. Obtener Préstamos Activos**
```sql
obtener_prestamos_activos(
  p_solicitante_id UUID DEFAULT NULL
) RETURNS JSON
```

#### **11. Obtener Préstamos Vencidos**
```sql
obtener_prestamos_vencidos() RETURNS JSON
```

---

### **🔧 MANTENIMIENTO**

#### **12. Registrar Mantenimiento**
```sql
registrar_mantenimiento_item(
  p_item_id UUID,
  p_tipo_mantenimiento VARCHAR(100),
  p_descripcion_trabajo TEXT,
  p_fecha_mantenimiento DATE DEFAULT CURRENT_DATE,
  p_responsable_id UUID,
  p_costo DECIMAL(10,2) DEFAULT 0,
  p_proveedor VARCHAR(200) DEFAULT NULL
) RETURNS JSON
```

**Tipos de mantenimiento:**
- `PREVENTIVO` - Mantenimiento programado
- `CORRECTIVO` - Reparación por daño
- `LIMPIEZA` - Limpieza profunda
- `REVISION` - Inspección de estado

#### **13. Obtener Historial de Mantenimiento**
```sql
obtener_historial_mantenimiento(p_item_id UUID) RETURNS JSON
```

#### **14. Programar Mantenimiento**
```sql
programar_mantenimiento(
  p_item_id UUID,
  p_fecha_programada DATE,
  p_tipo_mantenimiento VARCHAR(100),
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

#### **15. Obtener Mantenimientos Programados**
```sql
obtener_mantenimientos_programados(
  p_fecha_desde DATE DEFAULT CURRENT_DATE,
  p_fecha_hasta DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
) RETURNS JSON
```

---

### **📊 REPORTES Y ESTADÍSTICAS**

#### **16. Estadísticas Generales de Inventario**
```sql
obtener_estadisticas_inventario() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_items": 450,
    "items_disponibles": 380,
    "items_prestados": 45,
    "items_mantenimiento": 15,
    "items_baja": 10,
    "valor_total_inventario": 125000.00,
    "por_categoria": {
      "CAMPISMO": {"cantidad": 120, "valor": 45000.00},
      "PRIMEROS_AUXILIOS": {"cantidad": 50, "valor": 8000.00},
      "ACTIVIDADES": {"cantidad": 180, "valor": 35000.00},
      "UNIFORMES": {"cantidad": 80, "valor": 25000.00},
      "OFICINA": {"cantidad": 20, "valor": 12000.00}
    },
    "movimientos_ultimo_mes": 85,
    "prestamos_activos": 12
  }
}
```

#### **17. Reporte de Items Más Utilizados**
```sql
obtener_items_mas_utilizados(
  p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '6 months',
  p_limite INTEGER DEFAULT 20
) RETURNS JSON
```

#### **18. Reporte de Valor de Inventario**
```sql
obtener_reporte_valor_inventario(
  p_categoria VARCHAR(100) DEFAULT NULL
) RETURNS JSON
```

#### **19. Análisis de Rotación de Inventario**
```sql
analizar_rotacion_inventario(
  p_periodo_meses INTEGER DEFAULT 12
) RETURNS JSON
```

---

### **🔍 BÚSQUEDAS ESPECIALIZADAS**

#### **20. Buscar Items Disponibles para Préstamo**
```sql
buscar_items_disponibles_prestamo(
  p_categoria VARCHAR(100) DEFAULT NULL,
  p_cantidad_minima INTEGER DEFAULT 1,
  p_fecha_necesaria DATE DEFAULT CURRENT_DATE
) RETURNS JSON
```

#### **21. Verificar Disponibilidad para Actividad**
```sql
verificar_disponibilidad_actividad(
  p_items_requeridos JSON,
  p_fecha_actividad DATE
) RETURNS JSON
```

**Estructura items_requeridos:**
```json
[
  {"categoria": "CAMPISMO", "tipo": "carpa", "cantidad": 5},
  {"categoria": "PRIMEROS_AUXILIOS", "tipo": "botiquin", "cantidad": 2},
  {"item_especifico": "123e4567-e89b-12d3-a456-426614174000", "cantidad": 1}
]
```

#### **22. Items Próximos a Mantenimiento**
```sql
obtener_items_proximo_mantenimiento(
  p_dias_anticipacion INTEGER DEFAULT 30
) RETURNS JSON
```

---

### **📋 CATEGORÍAS Y CLASIFICACIÓN**

#### **23. Obtener Items por Categoría**
```sql
obtener_items_por_categoria(p_categoria VARCHAR(100)) RETURNS JSON
```

#### **24. Actualizar Categorización**
```sql
actualizar_categoria_item(
  p_item_id UUID,
  p_nueva_categoria VARCHAR(100),
  p_motivo TEXT DEFAULT NULL
) RETURNS JSON
```

#### **25. Obtener Resumen por Ubicación**
```sql
obtener_resumen_por_ubicacion() RETURNS JSON
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Cantidad disponible** - No permitir préstamos superiores al stock
- ✅ **Estado del item** - Solo items DISPONIBLES pueden prestarse
- ✅ **Límites de préstamo** - Validar límites por persona/actividad
- ✅ **Fechas coherentes** - Fechas de devolución futuras
- ✅ **Permisos de usuario** - Solo dirigentes autorizados pueden crear préstamos

### **Triggers Automáticos:**
```sql
-- Actualización automática de cantidades disponibles
-- Alertas por stock bajo
-- Registro automático en auditoría
-- Notificaciones de vencimiento de préstamos
```

---

## 📊 **Performance y Optimización**

### **Índices Estratégicos:**
- `idx_inventario_categoria_estado` - Búsquedas por categoría y estado
- `idx_inventario_ubicacion` - Consultas por ubicación
- `idx_inventario_nombre_gin` - Búsqueda de texto completo
- `idx_movimientos_fecha_tipo` - Historial de movimientos

### **Vistas Materializadas:**
```sql
-- Vista con resumen de inventario actualizada cada hora
SELECT * FROM mv_resumen_inventario;

-- Estadísticas por categoría (actualizada diariamente)
SELECT * FROM mv_estadisticas_inventario_categoria;
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_inventario();

-- Generar datos de prueba
SELECT generar_datos_prueba_inventario(cantidad_items := 100);

-- Test de préstamos
SELECT test_prestamos_inventario();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface ItemInventario {
  id: string;
  codigoItem: string;
  nombre: string;
  categoria: CategoriaInventario;
  cantidadTotal: number;
  cantidadDisponible: number;
  ubicacion: string;
  estado: EstadoItem;
  valorUnitario: number;
}

export class InventarioService {
  async buscarItems(filtros: FiltrosInventario): Promise<ItemInventario[]> {
    const { data } = await supabase.rpc('buscar_items_inventario', {
      p_filtros: filtros
    });
    
    return data.success ? data.data : [];
  }
  
  async crearPrestamo(prestamo: SolicitudPrestamo): Promise<string> {
    const { data } = await supabase.rpc('crear_prestamo_inventario', prestamo);
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data.prestamo_id;
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Preparar Equipos para Campamento:**
```sql
-- 1. Verificar disponibilidad
SELECT verificar_disponibilidad_actividad('[
  {"categoria": "CAMPISMO", "tipo": "carpa", "cantidad": 8},
  {"categoria": "PRIMEROS_AUXILIOS", "tipo": "botiquin", "cantidad": 2}
]'::json, '2024-07-20');

-- 2. Crear préstamo
SELECT crear_prestamo_inventario(...);

-- 3. Registrar devolución post-actividad
SELECT registrar_devolucion_prestamo(...);
```

### **2. Mantenimiento Preventivo:**
```sql
-- Programar mantenimientos
SELECT programar_mantenimiento(...);

-- Ejecutar mantenimiento
SELECT registrar_mantenimiento_item(...);
```

### **3. Control de Stock:**
```sql
-- Items con stock bajo
SELECT buscar_items_inventario('{"cantidad_disponible_maxima": 2}'::json);

-- Análisis de rotación
SELECT analizar_rotacion_inventario(12);
```

---

**📈 Total: 25 funciones implementadas para gestión completa de inventario**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**