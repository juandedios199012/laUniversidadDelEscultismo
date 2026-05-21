# 🔍 Diagnóstico: Inscripción de Dirigentes/Comité Devuelve 0 Registros

## Problema Reportado
- ✗ Al seleccionar dirigentes/comité en el modal de inscripción, muestra "0 inscripciones registradas exitosamente"
- ✗ Los filtros de la tabla de inscritos no tienen opciones para dirigente/comité

## Cambios Realizados - 11 de mayo de 2026

### 1️⃣ Frontend - Filtros de Inscripciones (InscripcionAnual.tsx)
✅ **Arreglado**: Ahora el filtro de rama maneja dirigentes/comité correctamente
- **Antes**: `if (filtroRama && i.scout.rama_actual !== filtroRama)` ← Fallaba para no-scouts
- **Después**: Verifica si existe rama_actual antes de comparar, y rechaza dirigentes/comité solo si se busca una rama específica

✅ **Arreglado**: La búsqueda por nombre ahora maneja valores NULL
- **Antes**: `.toLowerCase()` fallaba en campos NULL
- **Después**: Usa `(valor || '')` para evitar errores

✅ **Agregado**: Nuevo filtro de "Tipo de Persona"
- **Opciones**: Scout | Hermano (Scout) | Dirigente | Comité
- **Ubicación**: Entre Estado y Rama

---

## 🚨 Problema Raíz (Backend)

La función `api_inscribir_personas_masivo()` está omitiendo dirigentes/comité porque:

### Causa 1: Tarifas no configuradas
```sql
-- En api_inscribir_personas_masivo (línea ~200):
IF v_monto IS NULL OR v_monto <= 0 THEN
    v_errores := array_append(...'no hay tarifa configurada...');
    v_total_omitidos := v_total_omitidos + 1;
    CONTINUE;
END IF;
```

Si no existen tarifas para los perfiles `dirigente` y `comite` en el período actual,
todos los dirigentes/comité serán omitidos.

### Causa 2: Posibles datos incompletos
- No existen registros en tabla `dirigentes` o `comite_padres`
- Los dirigentes/comité tienen `estado` diferente a `'ACTIVO'`

---

## 📋 Pasos de Diagnóstico (SQL)

Ejecutar en Supabase SQL Editor:

### 1. Verificar perfiles de tarifa
```sql
SELECT id, codigo, nombre, activo FROM perfiles_tarifa 
WHERE codigo IN ('scout', 'dirigente', 'comite', 'hermano')
ORDER BY codigo;
```
✅ **Esperado**: Debe haber 4 filas (scout, dirigente, comite, hermano)

### 2. Verificar tarifas del período actual
```sql
SELECT 
    pt.id,
    ptf.codigo,
    ptf.nombre,
    tp.monto,
    tp.configurado,
    tp.periodo_id
FROM tarifas_periodo tp
JOIN perfiles_tarifa ptf ON ptf.id = tp.perfil_tarifa_id
WHERE tp.periodo_id = '2026'
ORDER BY ptf.codigo;
```
✅ **Esperado**: Debe haber 4 filas con montos configurados

### 3. Contar dirigentes activos
```sql
SELECT COUNT(*) as total_dirigentes FROM dirigentes 
WHERE estado = 'ACTIVO' OR estado IS NULL;
```
✅ **Esperado**: > 0

### 4. Contar comité activos
```sql
SELECT COUNT(*) as total_comite FROM comite_padres 
WHERE estado = 'ACTIVO' OR estado IS NULL;
```
✅ **Esperado**: > 0

### 5. Ver qué personas se listan como inscribibles para dirigentes
```sql
SELECT api_listar_personas_inscribibles('2026');
```
📋 **Revisar**: Que aparezcan personas con `tipo_registro = 'Dirigente'` y `'Comité'`

### 6. Intentar inscribir dirigente manualmente (Test)
```sql
-- Obtener ID de un dirigente de la consulta anterior
SELECT api_inscribir_personas_masivo(
    ARRAY['<PERSONA_ID_DE_DIRIGENTE>']::uuid[],
    '2026'
);
```
📊 **Revisar respuesta**: 
- Si `success = true` y `total_inscritos = 1` ✅ El backend funciona
- Si `total_omitidos = 1` ✗ Hay un error (revisar campo `errores`)

---

## ✅ Soluciones

### Opción A: Las tarifas NO existen (Caso más probable)

Ir a **Configuración › Tarifas** en la interfaz web y:
1. Seleccionar período **2026**
2. Configurar montos para:
   - ✏️ Scout
   - ✏️ Hermano
   - ✏️ Dirigente
   - ✏️ Comité

Ejemplo:
```
Scout: 150
Hermano: 100  
Dirigente: 200
Comité: 150
```

### Opción B: Las tarifas SÍ existen pero dirigentes/comité no

**A) Verificar que los dirigentes estén registrados**
- Ir a módulo **Dirigentes**
- Asegurarse de que existan registros activos

**B) Verificar que el comité esté registrado**  
- Ir a módulo **Comité**
- Asegurarse de que existan registros activos

---

## 🧪 Verificación Final

Después de configurar todo:

1. Ir a **Inscripción Anual**
2. Seleccionar período **2026**
3. Hacer clic en botón gris (abrir modal de inscripción selectiva)
4. En el dropdown de filtros, seleccionar **"Dirigentes"**
5. Debería mostrar lista de dirigentes activos
6. Seleccionar algunos y hacer clic en **"Inscribir Seleccionados"**
7. ✅ Debería mostrar: "N inscripciones registradas exitosamente"

---

## 📱 Cambios en UI

El componente InscripcionAnual.tsx ahora tiene:

### Nuevo Filtro
```
Estado | Tipo de Persona | Rama | [Búsqueda...]
```

### Filtro de Tipo de Persona
- Todos los tipos (vacío)
- Scout
- Hermano (Scout)
- Dirigente
- Comité

### Filtro de Rama (mejorado)
- Cuando se selecciona una rama específica, solo muestra scouts de esa rama
- Dirigentes/comité NO se muestran si se filtra por rama (porque no tienen rama_actual)
- Para ver dirigentes/comité: usar filtro "Tipo de Persona" en lugar de "Rama"

---

## 📝 Notas Técnicas

**Campo `perfil_codigo` en inscripciones**:
- `scout`: Scout normal
- `hermano`: Scout con hermano activo
- `dirigente`: Dirigente activo
- `comite`: Miembro de comité
- `otro`: Persona sin clasificación específica

**Backend retorna esto en el JSON de inscripciones**:
```json
{
  "perfil_codigo": "dirigente",
  "perfil_nombre": "Dirigente",
  "scout": {
    "id": null,
    "codigo_scout": null,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "rama_actual": null
  }
}
```

Cuando `scout.rama_actual` es NULL, significa que no es un scout (es dirigente/comité).

---

## 🔗 Referencias

- **Frontend Fix**: [InscripcionAnual.tsx](src/components/Inscripcion/InscripcionAnual.tsx)
  - Línea 85: Nuevo estado `filtroTipoPersona`
  - Línea 440-470: Lógica de filtros mejorada
  - Línea 617-660: Nueva UI con selector de tipo de persona

- **Backend RPC**: `api_inscribir_personas_masivo()` en [04_inscribibles_todas_personas.sql](database/04_inscribibles_todas_personas.sql)
  - Línea 140: Definición de función
  - Línea 195-210: Lógica de validación de tarifas

- **Backend RPC**: `api_listar_personas_inscribibles()` en [04_inscribibles_todas_personas.sql](database/04_inscribibles_todas_personas.sql)
  - Línea 27: Definición de función
  - Devuelve UNION de scouts + dirigentes + comité
