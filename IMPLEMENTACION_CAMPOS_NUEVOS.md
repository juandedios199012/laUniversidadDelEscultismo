# 📋 Implementación de Campos Nuevos - Scout y Familiar

**Fecha:** 4 de enero de 2026  
**Objetivo:** Agregar campos religiosos, médicos y de contacto extendido

---

## 🎯 Resumen de Cambios

### Campos Nuevos para SCOUT

#### 1. **Religiosos** (tabla `personas`)
- `religion` - VARCHAR(100) - Religión o credo

#### 2. **Datos Médicos/Salud** (tabla `personas` + `scouts`)
- `grupo_sanguineo` - VARCHAR(10) - A, B, AB, O
- `factor_sanguineo` - VARCHAR(10) - Positivo (+) o Negativo (-)
- `tipo_discapacidad` - VARCHAR(100) - Tipo de discapacidad
- `carnet_conadis` - VARCHAR(50) - Número de carné CONADIS
- `descripcion_discapacidad` - TEXT - Descripción detallada
- `seguro_medico` - VARCHAR(100) - Nombre del seguro (en tabla `scouts`)

#### 3. **Contacto Adicional** (tabla `personas`)
- `correo_secundario` - VARCHAR(255) - Segundo correo electrónico
- `celular_secundario` - VARCHAR(20) - Segundo número de celular

---

### Campos Nuevos para FAMILIAR

#### Campos que YA EXISTEN en `personas`:
✅ Sexo  
✅ Tipo de Documento  
✅ Número de Documento  
✅ Dirección  
✅ Departamento  
✅ Provincia  
✅ Distrito  
✅ Teléfono

#### Campos NUEVOS:
- `correo_secundario` - Correo 2 (en tabla `personas`)
- `celular_secundario` - Celular 2 (en tabla `personas`)
- `centro_laboral` - Centro de trabajo (en tabla `familiares_scout`)
- `cargo` - Puesto laboral (en tabla `familiares_scout`)
- `profesion` - RENOMBRADO desde `ocupacion` (en tabla `familiares_scout`)

---

## 📊 Arquitectura de Base de Datos

```
personas (tabla general)
├── Datos básicos: nombres, apellidos, fecha_nacimiento, sexo
├── Documentos: tipo_documento, numero_documento
├── Contacto: celular, celular_secundario, telefono, correo, correo_secundario
├── Ubicación: departamento, provincia, distrito, direccion
├── Religiosos: religion
└── Salud: grupo_sanguineo, factor_sanguineo, tipo_discapacidad, carnet_conadis, descripcion_discapacidad

scouts (tabla específica)
├── FK: persona_id → personas.id
├── Datos scout: codigo_scout, rama_actual, centro_estudio, ocupacion, centro_laboral
└── Salud: seguro_medico

familiares_scout (tabla específica)
├── FK: persona_id → personas.id
├── FK: scout_id → scouts.id
├── Relación: parentesco
├── Laboral: profesion, centro_laboral, cargo
└── Permisos: es_contacto_emergencia, es_autorizado_recoger
```

---

## 🎨 Propuesta de UX para Familiares

### Opción 1: **Tabla Editable con Modal** (RECOMENDADO) ⭐

```
┌─────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 DATOS DE FAMILIARES                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [➕ Agregar Familiar]                                    │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Nombre         │ Parentesco │ Celular    │ ✏️ 🗑️ │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ María García   │ MADRE      │ 987654321  │ ✏️ 🗑️ │   │
│ │ Juan Pérez     │ PADRE      │ 987123456  │ ✏️ 🗑️ │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Vista limpia y organizada
- ✅ Fácil agregar múltiples familiares
- ✅ Modal con formulario completo solo cuando se necesita
- ✅ Buena experiencia móvil
- ✅ Validación por familiar

**Modal al hacer clic en "Agregar" o "Editar":**
```
┌─────────────────────────────────────────┐
│  Agregar Familiar                    ❌  │
├─────────────────────────────────────────┤
│                                          │
│  📝 Datos Básicos                        │
│  Nombres: [_________________]            │
│  Apellidos: [_________________]          │
│  Sexo: [Masculino ▼]                     │
│  Parentesco: [Madre ▼]                   │
│                                          │
│  📄 Documentos                           │
│  Tipo: [DNI ▼]                           │
│  Número: [_________________]             │
│                                          │
│  📞 Contacto                             │
│  Celular 1*: [_________________]         │
│  Celular 2: [_________________]          │
│  Teléfono: [_________________]           │
│  Correo 1*: [_________________]          │
│  Correo 2: [_________________]           │
│                                          │
│  📍 Ubicación                            │
│  Dirección: [_________________]          │
│  Departamento: [_________________]       │
│  Provincia: [_________________]          │
│  Distrito: [_________________]           │
│                                          │
│  💼 Información Laboral                  │
│  Profesión: [_________________]          │
│  Centro Lab.: [_________________]        │
│  Cargo: [_________________]              │
│                                          │
│  ✅ Permisos                             │
│  ☑ Contacto de emergencia               │
│  ☐ Autorizado para recoger              │
│                                          │
│  [Cancelar]  [Guardar Familiar]          │
└─────────────────────────────────────────┘
```

---

### Opción 2: **Acordeón con Formularios Expandibles**

```
┌─────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 DATOS DE FAMILIARES                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [➕ Agregar Familiar]                                    │
│                                                          │
│ ▼ 👩 MADRE - María García                         ✏️ 🗑️ │
│   ├── Documento: DNI 12345678                           │
│   ├── Celular: 987654321 | Correo: maria@gmail.com     │
│   └── Profesión: Enfermera                              │
│                                                          │
│ ▶ 👨 PADRE - Juan Pérez                           ✏️ 🗑️ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Vista compacta
- ✅ Expandir para ver detalles
- ⚠️ Puede ser confuso con muchos campos

---

### Opción 3: **Pestañas por Familiar**

```
┌─────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 DATOS DE FAMILIARES                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Familiar 1] [Familiar 2] [Familiar 3 +]                │
│ ─────────────                                            │
│                                                          │
│  Nombres: [María]                                        │
│  Apellidos: [García]                                     │
│  Parentesco: [Madre ▼]                                   │
│  ...más campos...                                        │
│                                                          │
│  [🗑️ Eliminar Familiar]                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Un familiar a la vez
- ⚠️ No se ve cuántos hay sin cambiar pestañas

---

## 🏆 RECOMENDACIÓN FINAL

**Usar Opción 1: Tabla + Modal**

### Implementación sugerida:

1. **Sección de Familiares en el formulario principal:**
   - Mostrar tabla resumen con: Nombre Completo, Parentesco, Celular, Acciones
   - Botón "+ Agregar Familiar"
   - Mínimo 1 familiar requerido

2. **Modal para agregar/editar:**
   - Agrupación visual con iconos (📝 📄 📞 📍 💼)
   - Campos obligatorios marcados con *
   - Validación en tiempo real
   - Guardar como draft mientras se edita scout

3. **Campos obligatorios mínimos:**
   - Nombres, Apellidos
   - Parentesco
   - Celular 1
   - Correo 1

4. **Campos opcionales:**
   - Todos los demás pueden ser opcionales
   - Mostrar/ocultar secciones según relevancia

---

## 📝 Pasos de Implementación

### 1. Base de Datos
```bash
# Ejecutar en Supabase SQL Editor:
1. database/add_campos_nuevos_scout_familiar.sql
2. database/update_api_functions_campos_nuevos.sql
```

### 2. Frontend - Interfaces TypeScript
- Actualizar `src/types/index.ts` con nuevos campos
- Actualizar `src/lib/supabase.ts` con tipos extendidos

### 3. Frontend - Servicios
- Actualizar `scoutService.ts` para incluir nuevos campos
- Crear/actualizar funciones CRUD para familiares

### 4. Frontend - Componentes
- Extender formulario de registro de scout
- Crear componente `FamiliarModal.tsx`
- Crear componente `FamiliarTable.tsx`
- Actualizar validaciones

### 5. Frontend - Sección de Salud
- Crear sub-sección "Datos Religiosos"
- Crear sub-sección "Datos Médicos y Salud"
- Selectores para grupo/factor sanguíneo
- Textarea para descripción de discapacidad

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Ejecutar `add_campos_nuevos_scout_familiar.sql`
- [ ] Ejecutar `update_api_functions_campos_nuevos.sql`
- [ ] Verificar campos en tablas
- [ ] Probar funciones actualizadas

### Backend/API
- [ ] Actualizar función `api_registrar_scout_completo`
- [ ] Actualizar función `api_actualizar_scout`
- [ ] Crear función `api_agregar_familiar`
- [ ] Crear función `api_actualizar_familiar`
- [ ] Crear función `api_eliminar_familiar`

### Frontend - Tipos
- [ ] Actualizar interface `Scout`
- [ ] Crear interface `Familiar` completa
- [ ] Actualizar interface `ScoutFormData`

### Frontend - Servicios
- [ ] Actualizar `createScout` con nuevos campos
- [ ] Actualizar `updateScout` con nuevos campos
- [ ] Crear `createFamiliar`
- [ ] Crear `updateFamiliar`
- [ ] Crear `deleteFamiliar`

### Frontend - Componentes Scout
- [ ] Agregar sección "Datos Religiosos"
- [ ] Agregar sección "Datos Médicos"
- [ ] Agregar campos de contacto adicionales
- [ ] Validaciones de campos nuevos

### Frontend - Componentes Familiar
- [ ] Crear `FamiliarModal.tsx`
- [ ] Crear `FamiliarTable.tsx`  
- [ ] Implementar CRUD completo
- [ ] Validaciones de familiar
- [ ] Tests de componentes

### Reportes PDF
- [ ] Actualizar DNGI03Template con campos nuevos
- [ ] Agregar datos médicos al PDF
- [ ] Agregar datos completos de familiares

---

## 🔄 Orden de Ejecución

1. ✅ Crear scripts SQL → **YA CREADOS**
2. Ejecutar scripts en Supabase
3. Actualizar tipos TypeScript
4. Actualizar servicios
5. Crear componentes de familiar
6. Integrar en formulario de registro
7. Actualizar reportes PDF
8. Testing integral

---

## 💡 Notas Importantes

- Todos los campos nuevos son OPCIONALES por defecto
- La arquitectura personas+roles se mantiene
- Un familiar = 1 persona + 1 registro en familiares_scout
- Los campos de salud están en personas (no en scouts) para reutilización
- El seguro médico está en scouts porque es específico del rol

---

¿Quieres que proceda con la implementación del frontend ahora?
