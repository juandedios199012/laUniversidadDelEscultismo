# Scripts de Migración de Base de Datos

Este documento lista los scripts SQL que deben ejecutarse en Supabase para mantener la base de datos actualizada.

## Fecha: 3 de enero de 2026

### Scripts Ejecutados (en orden)

1. **add_ocupacion_to_familiares.sql**
   - **Descripción**: Agrega la columna `ocupacion` a la tabla `familiares_scout`
   - **Propósito**: Permitir almacenar la ocupación del familiar/tutor del scout
   - **Cambios**:
     - `ALTER TABLE familiares_scout ADD COLUMN ocupacion VARCHAR(255)`

2. **fix_actualizar_scout_function.sql**
   - **Descripción**: Actualiza la función `api_actualizar_scout` para incluir campos faltantes
   - **Propósito**: Permitir que la actualización de scouts persista correctamente los campos de sexo, tipo de documento, número de documento y fecha de nacimiento
   - **Cambios**:
     - Agrega actualización de `fecha_nacimiento`
     - Agrega actualización de `sexo`
     - Agrega actualización de `tipo_documento`
     - Agrega actualización de `numero_documento`

3. **rename_scouts_to_tropa.sql**
   - **Descripción**: Cambia "Scouts" por "Tropa" en el enum rama_enum
   - **Propósito**: Formalizar el nombre correcto de la rama para scouts de 11-14 años como "Tropa"
   - **Cambios**:
     - Agrega valor 'Tropa' al enum rama_enum
     - Actualiza todos los registros existentes de 'Scouts' a 'Tropa'

4. **update_ramas_completo.sql**
   - **Descripción**: Actualiza nomenclatura completa de ramas según estándar scout
   - **Propósito**: Formalizar nombres correctos de todas las ramas
   - **Cambios**:
     - Agrega valor 'Manada' (reemplaza Lobatos)
     - Agrega valor 'Caminantes' (nueva rama 15-17 años)
     - Agrega valor 'Clan' (reemplaza Rovers, 18-21 años)
     - Actualiza registros existentes

5. **fix_api_obtener_scout.sql**
   - **Descripción**: Agrega el campo `es_dirigente` a la función `api_obtener_scout`
   - **Propósito**: Permitir que el campo "Es Dirigente" se cargue correctamente al editar un scout
   - **Cambios**:
     - Agrega `'es_dirigente', s.es_dirigente` al JSON de respuesta
     - Corrige problema donde el checkbox no se mostraba activo en segunda edición

6. **sistema_personas_roles.sql** ⭐ REFACTORIZACIÓN MAYOR
   - **Descripción**: Implementa arquitectura de Personas + Roles
   - **Propósito**: Modelo normalizado donde scouts, dirigentes y familiares son personas con roles
   - **Cambios**:
     - Crea tabla `personas` (tabla base para todas las personas)
     - Crea tabla `roles_persona` (una persona puede tener múltiples roles)
     - Refactoriza tabla `scouts` para referenciar `personas`
     - Refactoriza tabla `dirigentes` para referenciar `personas`
     - Refactoriza tabla `familiares_scout` para referenciar `personas`
     - Una persona puede ser SCOUT + DIRIGENTE simultáneamente
     - Soporta EXSCOUT, PADRE_FAMILIA, COLABORADOR
     - Mantiene tabla `scouts_legacy` como backup

7. **migracion_personas_roles.sql**
   - **Descripción**: Migra datos del sistema anterior al nuevo sistema de personas/roles
   - **Propósito**: Convertir datos existentes sin pérdida de información
   - **Cambios**:
     - Migra scouts a personas y crea registros en scouts
     - Migra familiares a personas
     - Crea roles automáticamente (SCOUT, DIRIGENTE, PADRE_FAMILIA)
     - Mantiene relaciones familiares
     - Crea asignaciones iniciales dirigente-rama

---

## Cómo Ejecutar los Scripts

### Opción 1: Individual en Supabase SQL Editor

1. Accede a tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Copia y pega el contenido de cada script
4. Haz clic en **Run** para ejecutar

### Opción 2: Setup Único (Ejecutar todos)

Ejecuta el siguiente comando SQL que incluye todos los scripts en orden:

```sql
-- Script 1: Agregar columna ocupacion a familiares_scout
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'familiares_scout' 
        AND column_name = 'ocupacion'
    ) THEN
        ALTER TABLE familiares_scout 
        ADD COLUMN ocupacion VARCHAR(255);
        RAISE NOTICE 'Columna ocupacion agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna ocupacion ya existe';
    END IF;
END $$;

-- Script 2: Actualizar función api_actualizar_scout
CREATE OR REPLACE FUNCTION api_actualizar_scout(p_scout_id UUID, p_data JSON)
RETURNS JSON AS $$
DECLARE
    v_scout_exists BOOLEAN;
    v_old_data JSON;
    v_changes JSON := '{}';
BEGIN
    SELECT EXISTS(SELECT 1 FROM scouts WHERE id = p_scout_id) INTO v_scout_exists;
    
    IF NOT v_scout_exists THEN
        RETURN create_standard_response(
            false,
            'Scout no encontrado',
            NULL,
            json_build_array('ID de scout inválido')
        );
    END IF;
    
    SELECT to_json(s.*) INTO v_old_data FROM scouts s WHERE id = p_scout_id;
    
    UPDATE scouts SET
        nombres = COALESCE(TRIM(p_data ->> 'nombres'), nombres),
        apellidos = COALESCE(TRIM(p_data ->> 'apellidos'), apellidos),
        fecha_nacimiento = COALESCE((p_data ->> 'fecha_nacimiento')::DATE, fecha_nacimiento),
        sexo = COALESCE((p_data ->> 'sexo')::sexo_enum, sexo),
        tipo_documento = COALESCE((p_data ->> 'tipo_documento')::tipo_documento_enum, tipo_documento),
        numero_documento = COALESCE(p_data ->> 'numero_documento', numero_documento),
        celular = COALESCE(p_data ->> 'telefono', celular),
        correo = COALESCE(p_data ->> 'email', correo),
        direccion = COALESCE(p_data ->> 'direccion', direccion),
        distrito = COALESCE(p_data ->> 'distrito', distrito),
        provincia = COALESCE(p_data ->> 'provincia', provincia),
        departamento = COALESCE(p_data ->> 'departamento', departamento),
        centro_estudio = COALESCE(p_data ->> 'centro_estudio', centro_estudio),
        ocupacion = COALESCE(p_data ->> 'ocupacion', ocupacion),
        centro_laboral = COALESCE(p_data ->> 'centro_laboral', centro_laboral),
        rama_actual = COALESCE((p_data ->> 'rama')::rama_enum, rama_actual),
        estado = COALESCE((p_data ->> 'estado')::estado_enum, estado),
        observaciones = COALESCE(p_data ->> 'observaciones', observaciones),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_scout_id;
    
    PERFORM log_operation('scouts', 'UPDATE', p_scout_id, NULL, p_data);
    
    RETURN create_standard_response(
        true,
        'Scout actualizado exitosamente',
        json_build_object('scout_id', p_scout_id, 'cambios_aplicados', p_data)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN create_standard_response(
            false,
            'Error al actualizar scout',
            NULL,
            json_build_array('Error: ' || SQLERRM)
        );
END;
$$ LANGUAGE plpgsql;

-- Verificación final
SELECT 'Migración completada exitosamente' as status;
```

### Script 3: Cambiar "Scouts" por "Tropa"
```sql
-- Agregar el nuevo valor 'Tropa' al enum
ALTER TYPE rama_enum ADD VALUE IF NOT EXISTS 'Tropa';

-- Actualizar todos los registros que tengan 'Scouts' a 'Tropa'
UPDATE scouts 
SET rama_actual = 'Tropa'::rama_enum 
WHERE rama_actual = 'Scouts'::rama_enum;

-- Verificar el cambio
SELECT rama_actual, COUNT(*) as cantidad
FROM scouts
GROUP BY rama_actual
ORDER BY rama_actual;
```

---

## Notas Importantes

- Estos scripts son **idempotentes**: Pueden ejecutarse múltiples veces sin causar errores
- El script de `ocupacion` verifica si la columna existe antes de crearla
- La función `api_actualizar_scout` se reemplaza completamente con `CREATE OR REPLACE`

## Verificación Post-Migración

Para verificar que los scripts se ejecutaron correctamente:

```sql
-- Verificar columna ocupacion
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'familiares_scout' 
AND column_name = 'ocupacion';

-- Verificar función actualizada
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'api_actualizar_scout';
```

---

## Historial de Cambios

| Fecha | Script | Descripción |
|-------|--------|-------------|
| 2026-01-03 | add_ocupacion_to_familiares.sql | Agregar campo ocupación a familiares |
| 2026-01-03 | fix_actualizar_scout_function.sql | Fix persistencia de campos en actualización |
| 2026-01-03 | rename_scouts_to_tropa.sql | Cambiar "Scouts" por "Tropa" en rama_enum |
| 2026-01-03 | update_ramas_completo.sql | Actualizar nomenclatura completa de ramas |
| 2026-01-03 | fix_api_obtener_scout.sql | Agregar campo es_dirigente a respuesta de API |
| 2026-01-03 | sistema_personas_roles.sql | ⭐ Refactorización a modelo Personas + Roles |
| 2026-01-03 | migracion_personas_roles.sql | Migración de datos al nuevo sistema |

---

## 🔥 IMPORTANTE: Orden de Ejecución para Sistema Completo

### Opción 1: Setup Nuevo (Base de datos limpia)

1. `sistema_personas_roles.sql`
2. `sistema_dirigentes_completo.sql`
3. Cargar datos iniciales

### Opción 2: Migración desde Sistema Anterior

1. `add_es_dirigente_column.sql` (si no existe)
2. `sistema_personas_roles.sql` (crea nueva estructura)
3. `migracion_personas_roles.sql` (migra datos)
4. Verificar datos migrados
5. Opcional: Eliminar tablas `*_legacy`
