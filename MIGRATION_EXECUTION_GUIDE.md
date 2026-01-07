# 🚀 Guía de Ejecución de Migración - Sistema Personas + Roles

## 📋 Resumen de la Migración

Esta migración transforma el sistema de un modelo **scouts-céntrico** a un modelo **personas-céntrico** con soporte para múltiples roles.

### Beneficios del Nuevo Sistema:
- ✅ Una persona puede tener múltiples roles (SCOUT + DIRIGENTE simultáneamente)
- ✅ Familiares son personas con roles (mejor integridad de datos)
- ✅ Historial completo de cambios de roles
- ✅ Historial de dirigentes por rama
- ✅ Sin duplicación de datos personales
- ✅ Escalable para futuros roles (COLABORADOR, COMITE_APOYO, etc.)

## ⚠️ IMPORTANTE: Antes de Ejecutar

1. **Backup de la Base de Datos**: La migración preserva datos en tablas `*_legacy`, pero siempre haz backup
2. **Servidor de Desarrollo Detenido**: Detén el servidor Vite antes de migrar
3. **Ejecutar en Orden**: Los scripts DEBEN ejecutarse en el orden especificado
4. **Tiempo Estimado**: 5-10 minutos dependiendo de cantidad de datos

## 📝 Scripts de Migración

### Script 1: `sistema_personas_roles.sql`
**Propósito**: Crea la nueva estructura de base de datos

**Qué hace:**
- Crea tabla `personas` (base para todos)
- Crea tabla `roles_persona` (tracking de roles múltiples)
- Renombra `scouts` → `scouts_legacy` (backup)
- Crea nueva tabla `scouts` con FK a `personas`
- Crea nueva tabla `dirigentes` con FK a `personas`
- Renombra `familiares_scout` → `familiares_scout_legacy`
- Crea nueva tabla `familiares_scout` con FK a `personas`
- Crea tabla `asignaciones_dirigente_rama` (historial de ramas)
- Crea tabla `scouts_dirigente` (asignaciones scout-dirigente)
- Crea vistas `v_dirigentes_activos`, `v_historial_dirigente_ramas`
- Crea triggers para `updated_at`

**Ubicación**: `/database/sistema_personas_roles.sql`

### Script 2: `funciones_api_personas.sql`
**Propósito**: Crea las funciones RPC para el nuevo sistema

**Qué hace:**
- `api_registrar_persona(p_data JSON)` - Crear/actualizar persona por documento
- `api_registrar_scout_completo(p_scout_data, p_familiar_data)` - Registrar scout completo
- `api_actualizar_scout_completo(p_scout_id, p_scout_data, p_familiar_data)` - Actualizar todo
- `api_obtener_scout_completo(p_scout_id)` - Obtener scout con datos completos

**Ubicación**: `/database/funciones_api_personas.sql`

### Script 3: `migracion_personas_roles.sql`
**Propósito**: Migra todos los datos existentes al nuevo sistema

**Qué hace:**
- Migra `scouts_legacy` → `personas` + `scouts` + `roles_persona` (rol SCOUT)
- Migra `familiares_scout_legacy` → `personas` + `familiares_scout` + `roles_persona` (rol PADRE_FAMILIA)
- Crea `dirigentes` para scouts con `es_dirigente=true` + rol DIRIGENTE
- Crea `asignaciones_dirigente_rama` iniciales para dirigentes
- Mantiene todas las relaciones intactas
- Usa tablas temporales para mapeo de IDs

**Ubicación**: `/database/migracion_personas_roles.sql`

## 🔧 Pasos de Ejecución

### Paso 1: Detener el Servidor de Desarrollo
```bash
# Si el servidor está corriendo, detenerlo con Ctrl+C en la terminal
```

### Paso 2: Abrir Supabase SQL Editor
1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Click en **SQL Editor** en el menú lateral
3. Click en **New query**

### Paso 3: Ejecutar Script 1 - Crear Estructura
1. **Copia** el contenido completo de `/database/sistema_personas_roles.sql`
2. **Pega** en el SQL Editor
3. **Verifica** que no haya errores de sintaxis (panel inferior)
4. Click en **Run** (o `Ctrl/Cmd + Enter`)
5. **Espera** a que termine (debe decir "Success. No rows returned")
6. **Verifica** en el panel de tablas que existen:
   - `personas`
   - `roles_persona`
   - `scouts` (nueva)
   - `scouts_legacy` (backup)
   - `dirigentes`
   - `familiares_scout` (nueva)
   - `familiares_scout_legacy` (backup)
   - `asignaciones_dirigente_rama`
   - `scouts_dirigente`

### Paso 4: Ejecutar Script 2 - Crear Funciones API
1. **Copia** el contenido completo de `/database/funciones_api_personas.sql`
2. **Pega** en un nuevo query en SQL Editor
3. Click en **Run**
4. **Verifica** en **Database** → **Functions** que existen:
   - `api_registrar_persona`
   - `api_registrar_scout_completo`
   - `api_actualizar_scout_completo`
   - `api_obtener_scout_completo`

### Paso 5: Ejecutar Script 3 - Migrar Datos
1. **Copia** el contenido completo de `/database/migracion_personas_roles.sql`
2. **Pega** en un nuevo query en SQL Editor
3. Click en **Run**
4. **Espera** a que termine (puede tomar 1-3 minutos según cantidad de datos)
5. **Verifica** el mensaje final debe decir:
   ```
   ✅ Migración completada exitosamente
   - X scouts migrados
   - Y familiares migrados
   - Z dirigentes creados
   ```

### Paso 6: Verificar Migración

Ejecuta este query de verificación:

```sql
-- Verificar personas creadas
SELECT 'personas' as tabla, COUNT(*) as total FROM personas
UNION ALL
SELECT 'roles_persona', COUNT(*) FROM roles_persona
UNION ALL
SELECT 'scouts', COUNT(*) FROM scouts
UNION ALL
SELECT 'scouts_legacy', COUNT(*) FROM scouts_legacy
UNION ALL
SELECT 'dirigentes', COUNT(*) FROM dirigentes
UNION ALL
SELECT 'familiares_scout', COUNT(*) FROM familiares_scout
UNION ALL
SELECT 'familiares_scout_legacy', COUNT(*) FROM familiares_scout_legacy;

-- Verificar que scouts tienen persona_id
SELECT 
  s.id as scout_id,
  s.persona_id,
  p.nombres,
  p.apellidos,
  s.codigo_scout,
  s.rama_actual
FROM scouts s
INNER JOIN personas p ON s.persona_id = p.id
LIMIT 5;

-- Verificar roles de personas
SELECT 
  p.nombres,
  p.apellidos,
  rp.tipo_rol,
  rp.fecha_inicio,
  rp.estado
FROM personas p
INNER JOIN roles_persona rp ON rp.persona_id = p.id
WHERE rp.estado = 'ACTIVO'
LIMIT 10;
```

**Resultados esperados:**
- `scouts` = `scouts_legacy` (mismo número de registros)
- `personas` ≥ `scouts` (scouts + familiares)
- `roles_persona` ≥ `personas` (cada persona tiene al menos 1 rol)
- Todos los scouts tienen `persona_id` no nulo
- Dirigentes aparecen con rol SCOUT + rol DIRIGENTE

### Paso 7: Reiniciar Servidor de Desarrollo

```bash
npm run dev
```

### Paso 8: Probar Funcionalidad

1. **Registrar nuevo scout:**
   - Ir a Registro Scout
   - Llenar formulario completo (incluir datos de familiar)
   - Verificar que se crea correctamente
   - Verificar en Supabase que se creó:
     - 1 registro en `personas` (para scout)
     - 1 registro en `scouts` con `persona_id`
     - 1 registro en `roles_persona` con tipo SCOUT
     - 1 registro en `personas` (para familiar)
     - 1 registro en `familiares_scout` con `persona_id`
     - 1 registro en `roles_persona` con tipo PADRE_FAMILIA

2. **Editar scout existente:**
   - Buscar scout migrado
   - Editar datos (nombre, fecha nacimiento, etc.)
   - Guardar y verificar cambios

3. **Verificar Dashboard:**
   - Verificar que muestra scouts activos correctamente
   - Verificar contadores por rama

## 🔍 Queries de Diagnóstico

### Ver scouts con sus personas:
```sql
SELECT 
  s.codigo_scout,
  p.nombres || ' ' || p.apellidos as nombre_completo,
  p.numero_documento,
  s.rama_actual,
  s.estado,
  s.es_dirigente
FROM scouts s
INNER JOIN personas p ON s.persona_id = p.id
WHERE s.estado = 'ACTIVO'
ORDER BY s.created_at DESC
LIMIT 20;
```

### Ver roles de una persona:
```sql
SELECT 
  p.nombres || ' ' || p.apellidos as nombre,
  p.numero_documento,
  rp.tipo_rol,
  rp.fecha_inicio,
  rp.fecha_fin,
  rp.estado
FROM personas p
INNER JOIN roles_persona rp ON rp.persona_id = p.id
WHERE p.numero_documento = '12345678' -- Reemplazar con documento real
ORDER BY rp.fecha_inicio DESC;
```

### Ver dirigentes activos con su rama:
```sql
SELECT * FROM v_dirigentes_activos
ORDER BY rama_actual;
```

### Ver historial de ramas de un dirigente:
```sql
SELECT * FROM v_historial_dirigente_ramas
WHERE dirigente_id = 'xxx-xxx-xxx-xxx' -- Reemplazar con ID real
ORDER BY fecha_asignacion DESC;
```

## 🐛 Troubleshooting

### Error: "relation personas already exists"
**Solución**: El script ya fue ejecutado. Si quieres re-ejecutar:
1. Ejecuta script de rollback (si existe)
2. O elimina tablas manualmente en orden inverso

### Error: "function api_registrar_scout_completo does not exist"
**Solución**: Ejecuta el script 2 (`funciones_api_personas.sql`)

### Error: Frontend no encuentra scouts
**Solución**: 
1. Verifica que la migración se completó (Paso 6)
2. Verifica que el servidor está usando Supabase correcto
3. Revisa console.log en navegador para ver errores

### Scouts muestran datos incorrectos
**Solución**:
1. Verifica query de diagnóstico de scouts con personas
2. Revisa que `persona_id` no sea nulo
3. Verifica que hay registro en `personas` para cada scout

### Frontend muestra error "RPC function not found"
**Solución**: Ejecutar script 2 (`funciones_api_personas.sql`)

## 📊 Cambios en el Frontend

### Archivos Actualizados:
1. ✅ `src/lib/supabase.ts` - Interfaces TypeScript actualizadas
   - `Persona` interface (nueva)
   - `RolPersona` interface (nueva)
   - `Scout` interface con `persona_id` y campos desnormalizados
   - `FamiliarScout` interface con `persona_id`

2. ✅ `src/services/scoutService.ts` - Métodos actualizados
   - `registrarScout()` usa `api_registrar_scout_completo`
   - `updateScout()` usa `api_actualizar_scout_completo`
   - `getScoutById()` usa `api_obtener_scout_completo`

3. ⏳ `src/pages/RegistroScout.tsx` - **NO REQUIERE CAMBIOS**
   - El formulario ya envía los datos correctos
   - `scoutService` maneja la transformación internamente

## 🎯 Ventajas Post-Migración

### Para Desarrollo:
- ✅ Código más limpio y mantenible
- ✅ Menos duplicación de datos
- ✅ Mejor integridad referencial
- ✅ Consultas más eficientes

### Para Usuarios:
- ✅ Dirigentes pueden tener historial de ramas
- ✅ Una persona puede ser scout Y dirigente
- ✅ Familiares son ciudadanos de primera clase
- ✅ Reportes más precisos

### Para Futuro:
- ✅ Fácil agregar nuevos roles (COLABORADOR, COMITE_APOYO)
- ✅ Tracking completo de cambios de roles
- ✅ Reportes históricos precisos
- ✅ Soporte para ex-scouts que vuelven

## 📚 Documentación Relacionada

- `/database/README.md` - Estructura completa de base de datos
- `SISTEMA_DIRIGENTES_ARQUITECTURA.md` - Arquitectura del sistema de dirigentes
- `MIGRATION_SCRIPTS_README.md` - Lista de todos los scripts de migración

## ✅ Checklist de Ejecución

- [ ] Backup de base de datos realizado
- [ ] Servidor de desarrollo detenido
- [ ] Script 1 ejecutado (estructura)
- [ ] Script 2 ejecutado (funciones)
- [ ] Script 3 ejecutado (migración de datos)
- [ ] Verificación ejecutada (queries de diagnóstico)
- [ ] Servidor reiniciado
- [ ] Registro de nuevo scout probado
- [ ] Edición de scout existente probado
- [ ] Dashboard verificado
- [ ] Todos los tests pasando

## 🆘 Soporte

Si encuentras algún problema durante la migración:

1. **Revisa los logs** de Supabase en SQL Editor
2. **Ejecuta queries de diagnóstico** de este documento
3. **Verifica** que los 3 scripts se ejecutaron en orden
4. **Revisa** console.log en el navegador del frontend
5. **Consulta** documentación relacionada

---

**Última Actualización**: {{ fecha }}
**Versión del Sistema**: Personas + Roles v1.0
**Autor**: GitHub Copilot
