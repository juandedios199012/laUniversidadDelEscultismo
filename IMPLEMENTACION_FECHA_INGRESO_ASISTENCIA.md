# Implementación: Asistencia con Validación de Fecha de Ingreso
## Fecha: 20 de enero de 2026

---

## 📋 Resumen de Cambios

Se ha implementado un sistema que **filtra automáticamente** a los scouts en la asistencia según su fecha de ingreso:

✅ **Solo aparecen en asistencia** scouts que ya habían ingresado al grupo en la fecha del programa  
✅ **Estadísticas desde ingreso** - El % de asistencia solo cuenta programas posteriores a su ingreso  
✅ **Indicadores visuales** - Badge "Nuevo" para scouts con menos de 30 días en el grupo  

---

## 🗄️ 1. Base de Datos - Ejecutar Script SQL

### Paso 1: Conectar a la base de datos

```bash
# Opción A: Desde terminal
psql "postgresql://usuario:password@host:puerto/database"

# Opción B: Desde Supabase Dashboard
# SQL Editor → New Query
```

### Paso 2: Ejecutar el script

```bash
\i database/funciones_asistencia_con_fecha_ingreso.sql
```

O copia y pega el contenido completo del archivo en el SQL Editor de Supabase.

### Funciones creadas:

1. **`obtener_scouts_elegibles_fecha(fecha, rama)`**  
   Retorna solo scouts que ya habían ingresado en esa fecha

2. **`obtener_asistencia_scout_desde_ingreso(scout_id)`**  
   Calcula estadísticas desde su fecha de ingreso

3. **`validar_scout_elegible_programa(scout_id, programa_id)`**  
   Valida si scout debe aparecer en asistencia de un programa

4. **Índices de optimización** en `fecha_ingreso`, `fecha`, `fecha_inicio`

### Verificar instalación:

```sql
-- Ver funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%scout%'
  AND routine_name LIKE '%fecha%';

-- Test rápido
SELECT * FROM obtener_scouts_elegibles_fecha(CURRENT_DATE, 'TROPA') LIMIT 5;
```

---

## 💻 2. Frontend - Ya Actualizado

### Archivos modificados:

#### `src/services/asistenciaService.ts`
- ✅ Agregadas 3 funciones que llaman a las RPC functions de BD
- ✅ `getScoutsElegiblesFecha()` - Para toma de asistencia
- ✅ `getEstadisticasScoutDesdeIngreso()` - Para reportes
- ✅ `validarScoutElegiblePrograma()` - Para validaciones

#### `src/components/Asistencia/ReporteAsistenciaScout.tsx`
- ✅ Usa `getEstadisticasScoutDesdeIngreso()` en lugar de cálculo manual
- ✅ Badge "Nuevo" para scouts con menos de 30 días
- ✅ Muestra fecha de ingreso bajo el nombre
- ✅ Tooltip explicativo

---

## 🧪 3. Testing

### Test 1: Scout nuevo (ingreso reciente)
1. Ir a **Registro de Scout**
2. Crear scout con `fecha_ingreso = HOY`
3. Ir a **Reportes por Scout** en Asistencia
4. ✅ Debe aparecer con badge "Nuevo"
5. ✅ Total Reuniones debe ser = cantidad de programas desde hoy

### Test 2: Scout con ingreso futuro
1. Crear scout con `fecha_ingreso = MAÑANA`
2. Intentar registrar asistencia para programa de HOY
3. ✅ NO debe aparecer en la lista

### Test 3: Scout sin fecha de ingreso
1. Crear scout sin `fecha_ingreso` (NULL)
2. ✅ Debe aparecer en todos los programas (comportamiento legacy)

### Test 4: Cálculo de porcentaje correcto
1. Scout con ingreso hace 5 programas
2. Asistió a 4 de esos 5
3. ✅ % Asistencia = 80% (no cuenta programas anteriores a ingreso)

---

## 📊 4. Impacto en Módulos

| Módulo | ¿Requiere cambios? | Estado |
|--------|-------------------|--------|
| **Reporte por Scout** | ✅ Sí | ✅ Implementado |
| **Asistencia Masiva** | 🔜 Pendiente | Próximo paso |
| **Dashboard** | 🔜 Pendiente | Próximo paso |
| **Móvil** | 🔜 Pendiente | Próximo paso |

---

## 🚀 5. Próximos Pasos

### Fase 2: Asistencia Masiva
Actualizar componente para que **solo muestre scouts elegibles** en la fecha del programa:

```typescript
// En Asistencia.tsx - función cargarScoutsParaAsistencia()
const { data: scoutsElegibles } = await AsistenciaService
  .getScoutsElegiblesFecha(programaSeleccionado.fecha_inicio, filtroRama);
```

### Fase 3: Dashboard/KPIs
Actualizar métricas para considerar solo scouts activos en el período:
- Total scouts activos en fecha X
- Promedio asistencia del mes (solo scouts que ya habían ingresado)

### Fase 4: Módulo Móvil
Aplicar mismo filtro en toma de asistencia móvil.

---

## 🐛 Troubleshooting

### Error: "function does not exist"
**Causa:** Script SQL no ejecutado correctamente  
**Solución:** Verificar permisos, ejecutar script completo nuevamente

### Scouts no aparecen en asistencia
**Causa 1:** `fecha_ingreso` futura  
**Solución:** Verificar dato en tabla `personas`

**Causa 2:** Estado != 'ACTIVO'  
**Solución:** Verificar `scouts.estado`

### % Asistencia en 0% para todos
**Causa:** Índice no creado o función no encuentra asistencias  
**Solución:** 
```sql
-- Verificar asistencias
SELECT COUNT(*) FROM asistencias WHERE scout_id = 'ID_SCOUT';
```

---

## 📚 Referencias

- **Archivo SQL:** `database/funciones_asistencia_con_fecha_ingreso.sql`
- **Servicio:** `src/services/asistenciaService.ts`
- **Componente:** `src/components/Asistencia/ReporteAsistenciaScout.tsx`
- **Política de datos:** `.github/copilot-instructions.md`

---

## ✅ Checklist de Implementación

- [x] Crear funciones en PostgreSQL
- [x] Crear índices de optimización
- [x] Actualizar servicio TypeScript
- [x] Actualizar ReporteAsistenciaScout
- [x] Agregar indicadores visuales
- [ ] **Ejecutar script SQL** ← **PENDIENTE: HACER AHORA**
- [ ] Testing con datos reales
- [ ] Actualizar Asistencia Masiva
- [ ] Actualizar Dashboard
- [ ] Actualizar Móvil

---

**🎯 Acción inmediata:** Ejecutar el script SQL en Supabase para activar las funciones.
