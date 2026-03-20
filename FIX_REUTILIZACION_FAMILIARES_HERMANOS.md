# Fix: Reutilización de Personas (Familiares de Hermanos)

## Problema
Al registrar hermanos scouts que comparten los mismos familiares (padre/madre), el sistema mostraba el error:
```
duplicate key value violates unique constraint "idx_persona_documento_unique"
```

Esto ocurría porque al agregar un familiar con un DNI que ya existía en la tabla `personas`, la restricción única impedia crear un duplicado.

## Solución Implementada

### 1. Backend (SQL)

**Archivo:** `database/55_reutilizar_persona_existente_familiares.sql`

#### Nueva función: `api_buscar_persona_por_documento`
- Busca si existe una persona con un documento específico
- Retorna datos de la persona y de qué scouts es familiar
- Usada para validación onBlur en el frontend

#### Modificación: `api_actualizar_scout`
- Antes de crear un nuevo familiar, verifica si ya existe persona con ese documento
- Si existe, reutiliza esa persona (solo crea el vínculo `familiares_scout`)
- Si no existe, crea persona nueva
- Previene vínculos duplicados (mismo familiar para mismo scout)

#### Modificación: `api_registrar_scout_completo`
- Misma lógica de reutilización al crear scouts nuevos
- Estadísticas de familiares reutilizados vs nuevos

### 2. Frontend (TypeScript/React)

#### ScoutService
**Archivo:** `src/services/scoutService.ts`

Nueva función `buscarPersonaPorDocumento()`:
```typescript
static async buscarPersonaPorDocumento(
  tipoDocumento: string,
  numeroDocumento: string
): Promise<{
  existe: boolean;
  persona_id?: string;
  nombres?: string;
  apellidos?: string;
  es_familiar_de?: Array<{...}>;
  // ...
}>
```

#### DatosFamiliares Component
**Archivo:** `src/components/RegistroScout/components/DatosFamiliares.tsx`

Mejoras UX implementadas:
1. **Validación onBlur**: Al salir del campo "Nº Documento", se verifica automáticamente
2. **Indicador de carga**: Spinner mientras se verifica
3. **Alert informativo**: Muestra los datos de la persona encontrada
4. **Muestra scouts relacionados**: "Ya es familiar de: Juan Pérez (padre)"
5. **Botones de acción**:
   - "Usar datos existentes": Copia los datos al formulario
   - "Continuar con mis datos": Ignora la advertencia (el backend aún reutiliza)

## Flujo de Usuario

### Caso 1: Registrar segundo hermano (CREAR)

1. Usuario agrega familiar "María García" con DNI 12345678
2. Al salir del campo DNI, sistema detecta que ya existe
3. Muestra alert: "Este documento ya está registrado"
4. Muestra: "María García • 987654321"
5. Muestra: "Ya es familiar de: Pedro García (madre)"
6. Usuario puede:
   - **Opción A**: "Usar datos existentes" → Copia nombre, celular, correo
   - **Opción B**: "Continuar con mis datos" → Mantiene lo que escribió
7. Al guardar, el backend:
   - NO crea persona duplicada
   - Solo crea vínculo `familiares_scout` para el nuevo scout
   - Actualiza datos de contacto si vienen nuevos

### Caso 2: Editar familiar existente (EDITAR)

1. Usuario abre scout para editar
2. Cambia el DNI de un familiar existente
3. Si el nuevo DNI ya existe en otra persona:
   - **Frontend**: Muestra alert informando que el documento ya existe
   - **Backend**: NO actualiza el documento (previene error de constraint)
   - **Backend**: SÍ actualiza el resto de datos (nombre, celular, etc.)
4. El sistema NO falla, simplemente mantiene el documento original

### Comportamiento Seguro

| Escenario | DNI Nuevo | Acción Backend |
|-----------|-----------|----------------|
| Crear familiar | No existe | Crear persona nueva |
| Crear familiar | Ya existe | Reutilizar persona, crear solo vínculo |
| Editar familiar | No cambió | Actualizar datos normalmente |
| Editar familiar | Cambió a existente | Mantener DNI original, actualizar resto |
| Editar familiar | Cambió a nuevo | Actualizar DNI y todo |

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `database/55_reutilizar_persona_existente_familiares.sql` | Nuevo script SQL |
| `src/services/scoutService.ts` | Nueva función `buscarPersonaPorDocumento` |
| `src/components/RegistroScout/components/DatosFamiliares.tsx` | Validación onBlur + Alert UI |

## Instrucciones de Instalación

### 1. Ejecutar script SQL
```bash
# En Supabase SQL Editor, ejecutar:
database/55_reutilizar_persona_existente_familiares.sql
```

### 2. Reiniciar frontend
```bash
npm run dev
```

## Verificación

1. Crear Scout A con familiar "María García" DNI 12345678
2. Crear Scout B (hermano)
3. En familiares, agregar con DNI 12345678
4. Debe aparecer alert amarillo indicando persona existente
5. Al guardar, no debe dar error de constraint
6. Verificar que ambos scouts tienen el mismo `persona_id` en `familiares_scout`

## Principios Aplicados

- **DRY**: Reutilización de personas en lugar de duplicados
- **SOLID**: Separación de responsabilidades (búsqueda vs creación)
- **"Don't make me think"**: Usuario informado proactivamente
- **Validación onBlur**: Feedback inmediato sin esperar submit
- **Integridad de datos**: Constraint se mantiene, lógica lo respeta
- **Escalabilidad**: Funciona para N hermanos con N familiares compartidos

