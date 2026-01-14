# 🧹 Limpieza de Ramas - Guía de Ejecución

## Objetivo
Establecer las **4 ramas oficiales** en la base de datos:
- **Manada** (7-10 años)
- **Tropa** (11-14 años)
- **Comunidad** (15-17 años)
- **Clan** (18-21 años)

## 📋 Pasos para Limpiar la Base de Datos

### Paso 1: Backup de la Base de Datos
**⚠️ OBLIGATORIO antes de ejecutar cualquier script**

```bash
# Conectar a Supabase y crear backup
pg_dump -h [TU_HOST] -U postgres -d postgres > backup_antes_limpieza_ramas.sql
```

### Paso 2: Conectar a la Base de Datos

Opciones para ejecutar:

**Opción A: Supabase SQL Editor (Recomendado)**
1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido de `database/limpiar_ramas_final.sql`
5. Hacer clic en "Run"

**Opción B: Terminal con psql**
```bash
psql -h [TU_HOST] -U postgres -d postgres -f database/limpiar_ramas_final.sql
```

### Paso 3: Verificar la Ejecución

El script mostrará:
- ✅ Estado actual del enum
- ✅ Valores agregados
- ✅ Cantidad de registros migrados por tabla
- ✅ Resumen final

### Paso 4: Verificar Datos en las Tablas

Ejecuta estas consultas para confirmar:

```sql
-- Ver scouts por rama
SELECT rama_actual, COUNT(*) as total
FROM scouts
WHERE estado = 'ACTIVO'
GROUP BY rama_actual
ORDER BY rama_actual;

-- Ver patrullas por rama
SELECT rama, COUNT(*) as total
FROM patrullas
WHERE estado = 'ACTIVO'
GROUP BY rama
ORDER BY rama;
```

**Resultado esperado:**
```
rama_actual | total
------------+------
Clan        | X
Comunidad   | X
Manada      | X
Tropa       | X
```

### Paso 5: Probar la Aplicación

1. Recargar la aplicación web (Ctrl+R / Cmd+R)
2. Ir a cualquier módulo que use ramas:
   - Registro de Scouts
   - Asistencia
   - Programa Semanal
   - Puntajes (mobile/web)
3. Verificar que los selectores muestren: Manada, Tropa, Comunidad, Clan

## 🔍 Qué hace el Script

### Migración de Datos

**Valores Legacy → Valores Oficiales:**

| Valor Antiguo | Valor Nuevo |
|---------------|-------------|
| Lobatos       | Manada      |
| Castores      | Manada      |
| Scouts        | Tropa       |
| Caminantes    | Comunidad   |
| Ventures      | Comunidad   |
| Rovers        | Clan        |

### Tablas Afectadas

El script actualiza estas tablas:
- ✅ `scouts` (rama_actual)
- ✅ `patrullas` (rama)
- ✅ `programa_semanal` (rama)
- ✅ `asistencias` (rama)
- ✅ `inscripciones_anuales` (rama)

### Seguridad

- El script usa una **transacción** (BEGIN/COMMIT)
- Si hay algún error, todo se revierte automáticamente
- Los valores legacy permanecen en el enum (por compatibilidad)
- **NO se eliminan datos**, solo se actualizan valores

## 🖥️ Cambios en el Código

### Archivos Actualizados

1. **`src/utils/ramaUtils.ts`**
   - Simplificado: solo un tipo `Rama`
   - Eliminadas funciones de conversión UI ↔ BD
   - Mapeo legacy para compatibilidad

2. **`src/services/programaSemanalService.ts`**
   - Usa `normalizarRama()` de utils
   - Maneja valores legacy automáticamente

3. **`src/services/asistenciaService.ts`**
   - Usa `normalizarRama()` de utils
   - Maneja valores legacy automáticamente

4. **Componentes Mobile:**
   - `ScoutsScreen.tsx`: ramas = ['Manada', 'Tropa', 'Comunidad', 'Clan']
   - `AsistenciaScreen.tsx`: mismo array
   - `PuntajesScreen.tsx`: usa valores normalizados

### No Requieren Cambios

Los componentes web que tienen selectores de rama ya están preparados
para usar cualquier valor del enum.

## ⚠️ Notas Importantes

### Sobre los Valores Legacy

Los valores antiguos (Lobatos, Scouts, Rovers, etc.) **permanecen en el enum**
de PostgreSQL por razones técnicas:

- No se pueden eliminar valores de un enum si se usaron alguna vez
- Permiten compatibilidad con datos históricos
- No interfieren con la operación normal

Si en el futuro es **absolutamente necesario** eliminarlos, se debe:
1. Crear un nuevo tipo enum
2. Convertir todas las columnas al nuevo tipo
3. Eliminar el tipo antiguo

**Esto NO es recomendado** y solo debe hacerse si hay una razón muy fuerte.

### Valores en Código vs Base de Datos

Después de ejecutar el script:

**✅ Base de Datos:**
- Enum tiene: Manada, Tropa, Comunidad, Clan, Dirigentes (+ valores legacy)
- Todos los registros usan: Manada, Tropa, Comunidad, Clan

**✅ Código Frontend:**
- Usa directamente: Manada, Tropa, Comunidad, Clan
- La función `normalizarRama()` convierte legacy automáticamente

**✅ Resultado:**
- No hay conversión UI ↔ BD
- Todo usa los mismos 4 valores
- Código más limpio y simple

## ✅ Checklist de Verificación

Después de ejecutar el script:

- [ ] Script ejecutado sin errores
- [ ] Resumen final muestra cantidades correctas
- [ ] Consulta de verificación muestra solo: Manada, Tropa, Comunidad, Clan
- [ ] Aplicación web recargada
- [ ] Selectores de rama muestran los 4 valores correctos
- [ ] Registro de scout funciona correctamente
- [ ] Asistencia carga scouts por rama
- [ ] Puntajes carga patrullas por rama (web y mobile)
- [ ] Mobile PWA funciona en iPhone (http://192.168.18.9:3000/)

## 🆘 Solución de Problemas

### Error: "duplicate key value violates unique constraint"

**Causa:** Ya existen registros con los valores oficiales

**Solución:** El script es idempotente, puedes ejecutarlo múltiples veces

### Error: "invalid input value for enum rama_enum"

**Causa:** El valor que se intenta usar no existe en el enum

**Solución:** Ejecutar primero el PASO 2 del script que agrega los valores

### Los selectores aún muestran valores viejos

**Causa:** Cache del navegador

**Solución:**
1. Recargar con Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
2. O limpiar cache del navegador

## 📞 Contacto

Si encuentras algún problema durante la ejecución:
1. Verificar logs del script SQL
2. Revisar si el backup se creó correctamente
3. Restaurar backup si es necesario: `psql -h [HOST] -U postgres -d postgres < backup_antes_limpieza_ramas.sql`
