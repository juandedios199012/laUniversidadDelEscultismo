# Refactorización: Datos de Salud en Tabla Personas

## Fecha: 23 de enero de 2026

---

## 📋 Resumen del Cambio

Se refactorizó el modelo de datos siguiendo principios **DRY** y **SOLID** para centralizar los datos de salud y personales en la tabla `personas`, en lugar de duplicarlos en `scouts` y `dirigentes`.

### Justificación

- Los datos de salud (grupo sanguíneo, seguro, discapacidad) pertenecen a la **PERSONA**, no al rol
- Una persona puede ser **scout Y dirigente** simultáneamente
- Sus datos de salud son los mismos independientemente del rol
- Evitar duplicación y mantener una **única fuente de verdad**

---

## ✅ Estado Actual

| Componente | Estado |
|------------|--------|
| TypeScript tipos | ✅ Actualizado |
| Formulario dirigentes | ✅ Actualizado |
| PDF dirigentes | ✅ Actualizado |
| Funciones SQL | ✅ Actualizadas |
| Migración DB | ⏳ Pendiente ejecución |

---

## 🗃️ Campos Centralizados en `personas`

| Campo | Descripción |
|-------|-------------|
| `religion` | Religión o creencia |
| `codigo_postal` | Código postal de la dirección |
| `correo_institucional` | Correo institucional scout/dirigente |
| `correo_secundario` | Correo alternativo |
| `grupo_sanguineo` | Grupo sanguíneo: A, B, AB, O |
| `factor_sanguineo` | Factor RH: POSITIVO, NEGATIVO |
| `seguro_medico` | Nombre del seguro médico o EPS |
| `tipo_discapacidad` | Tipo de discapacidad si aplica |
| `carnet_conadis` | Número de carnet CONADIS |
| `descripcion_discapacidad` | Descripción detallada |

---

## 🔧 Archivos Modificados

### 1. Base de Datos

- **`database/migrations/add_campos_salud_personas.sql`** (NUEVO)
  - Agrega las columnas a la tabla `personas`
  - Migra datos existentes desde `scouts`
  - Incluye queries de verificación

- **`database/dirigentes/01_modelo_datos_dngi02.sql`** (MODIFICADO)
  - `registrar_dirigente_completo`: Inserta datos de salud en `personas`
  - `obtener_dirigentes_completo`: Lee datos de salud desde `p.` (personas)
  - `obtener_dirigente_por_id`: Lee datos de salud desde `p.` (personas)
  - `actualizar_dirigente`: Actualiza datos de salud en `personas`

### 2. Frontend (TypeScript)

- **`src/types/dirigente.ts`**
  - `PersonaDirigente`: Agregado `correo_institucional`, `codigo_postal`
  - `FormularioDirigente`: Agregado `correo_institucional`, `codigo_postal`
  - `FORMULARIO_INICIAL`: Agregado valores iniciales

- **`src/components/DirigentesV2/FormularioDirigente.tsx`**
  - Carga de datos: Lee `correo_institucional` y `codigo_postal` de persona

---

## 🚀 Instrucciones de Ejecución

### Orden de Ejecución en Supabase

```sql
-- PASO 1: Ejecutar migración de columnas a personas
-- Ir a Supabase > SQL Editor > Pegar y ejecutar:
-- database/migrations/add_campos_salud_personas.sql

-- PASO 2: Ejecutar funciones actualizadas de dirigentes
-- database/dirigentes/01_modelo_datos_dngi02.sql
```

### Verificación Post-Migración

```sql
-- Verificar que las columnas existen en personas
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'personas'
  AND column_name IN (
    'religion', 'grupo_sanguineo', 'factor_sanguineo', 
    'seguro_medico', 'tipo_discapacidad'
  );
```

---

## ⚠️ Próximos Pasos (Pendientes)

### 1. Actualizar API de Scouts
Las funciones de scouts (`api_registrar_scout_completo`, `api_actualizar_scout_completo`, `api_obtener_scout_completo`) deben actualizarse para leer/escribir datos de salud desde `personas` en lugar de `scouts`.

### 2. Eliminar Columnas Duplicadas de `scouts`
**Solo después de verificar que todo funciona correctamente:**

```sql
-- DESCOMENTAR SOLO DESPUÉS DE VERIFICAR
-- ALTER TABLE scouts DROP COLUMN IF EXISTS grupo_sanguineo;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS factor_sanguineo;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS seguro_medico;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS religion;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS tipo_discapacidad;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS carnet_conadis;
-- ALTER TABLE scouts DROP COLUMN IF EXISTS descripcion_discapacidad;
```

---

## 📊 Diagrama del Modelo

```
┌─────────────────────────────────────────────────────────────┐
│                        PERSONAS                              │
│─────────────────────────────────────────────────────────────│
│ id (PK)                                                      │
│ nombres, apellidos, fecha_nacimiento, sexo                   │
│ tipo_documento, numero_documento                             │
│ correo, correo_institucional, correo_secundario              │
│ celular, telefono                                            │
│ departamento, provincia, distrito, direccion, codigo_postal  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ DATOS DE SALUD (CENTRALIZADOS):                              │
│ religion                                                     │
│ grupo_sanguineo, factor_sanguineo                            │
│ seguro_medico                                                │
│ tipo_discapacidad, carnet_conadis, descripcion_discapacidad  │
└─────────────────────────────────────────────────────────────┘
                      ▲                       ▲
                      │ persona_id            │ persona_id
          ┌──────────┴──────────┐  ┌─────────┴──────────┐
          │       SCOUTS        │  │     DIRIGENTES     │
          │─────────────────────│  │────────────────────│
          │ id (PK)             │  │ id (PK)            │
          │ persona_id (FK)     │  │ persona_id (FK)    │
          │ rama_actual         │  │ cargo              │
          │ codigo_scout        │  │ grupo_id           │
          │ ...datos del rol... │  │ ...datos del rol...│
          └─────────────────────┘  └────────────────────┘
```

---

## ✅ Beneficios

1. **DRY**: Un solo lugar para datos de salud
2. **Integridad**: Datos consistentes si la persona es scout Y dirigente
3. **Mantenibilidad**: Cambios en un solo lugar
4. **Escalabilidad**: Fácil agregar nuevos roles sin duplicar campos
5. **Clean Code**: Separación clara de responsabilidades
