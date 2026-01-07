# 🎯 IMPLEMENTACIÓN REGISTRO DE DIRIGENTES

**Fecha:** 4 de enero de 2026  
**Objetivo:** Sistema simplificado de registro de dirigentes basado en personas + roles

---

## ✅ ARCHIVOS CREADOS

### 1. **Base de Datos**
- ✅ `/database/api_registrar_dirigente.sql` - Función SQL completa

### 2. **Frontend**
- ✅ `/src/components/Dirigentes/RegistroDirigente.tsx` - Componente nuevo simplificado
- ✅ `/src/App.tsx` - Actualizado para usar nuevo componente

### 3. **Backup**
- ✅ `/src/components/Dirigentes/old_backup/` - Componentes antiguos respaldados

---

## 📋 PASOS DE INSTALACIÓN

### **PASO 1: Ejecutar Script SQL** ⚠️ (TÚ LO HACES)

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia el contenido de `database/api_registrar_dirigente.sql`
4. Ejecuta el script
5. Verifica que aparezca: `✅ Función api_registrar_dirigente creada exitosamente`

### **PASO 2: Verificar Frontend** (ya está hecho)

El frontend ya está actualizado y listo para usar.

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### **Función SQL: `api_registrar_dirigente`**

#### **Caso 1: Promoción de Scout Existente**
```typescript
const { data } = await supabase.rpc('api_registrar_dirigente', {
  p_scout_id: 'uuid-del-scout',
  p_cargo: 'JEFE_RAMA',
  p_ramas_asignadas: ['Manada', 'Tropa'],
  p_es_responsable_principal: true,
  p_especialidades: ['Primeros Auxilios', 'Campismo'],
  p_observaciones: 'Promoción por experiencia'
});
```

#### **Caso 2: Dirigente Externo Nuevo**
```typescript
const { data } = await supabase.rpc('api_registrar_dirigente', {
  p_datos_persona: {
    nombres: "Carlos",
    apellidos: "García",
    fecha_nacimiento: "1985-08-20",
    sexo: "MASCULINO",
    tipo_documento: "DNI",
    numero_documento: "45678901",
    celular: "987654321",
    correo: "carlos@email.com",
    direccion: "Av. Principal 123"
  },
  p_cargo: 'ASESOR',
  p_ramas_asignadas: ['Rovers'],
  p_certificaciones: ['Formación Básica', 'Seguridad']
});
```

---

## 🔧 ARQUITECTURA IMPLEMENTADA

```
┌─────────────────────────────────────────────────────────┐
│                  REGISTRO DIRIGENTE                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Tipo de Registro?     │
              └─────────────────────────┘
                     │              │
          ┌──────────┘              └──────────┐
          ▼                                    ▼
   Scout Existente                     Persona Nueva
          │                                    │
          ├─ Buscar persona_id                ├─ Crear en personas
          │  desde scouts                     │  (validar duplicados)
          │                                   │
          └────────────┬──────────────────────┘
                       ▼
         ┌──────────────────────────┐
         │  Crear en dirigentes     │
         │  - persona_id            │
         │  - cargo                 │
         │  - número credencial     │
         │  - especialidades        │
         └──────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │  Agregar rol DIRIGENTE   │
         │  en roles_persona        │
         └──────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │  Asignar ramas           │
         │  asignaciones_dirigente  │
         └──────────────────────────┘
```

---

## 📊 VALIDACIONES IMPLEMENTADAS

### En la Función SQL:
- ✅ Scout existe y está activo (si es promoción)
- ✅ No duplicar dirigentes (persona ya es dirigente)
- ✅ No duplicar personas (busca por documento)
- ✅ Genera credencial automática: `DIR-2026-001`
- ✅ Valida parámetros requeridos

### En el Frontend:
- ✅ Formularios validados con `required`
- ✅ Selector visual de tipo de registro
- ✅ Checkboxes para ramas múltiples
- ✅ Formato de especialidades/certificaciones separadas por coma
- ✅ Búsqueda en tiempo real de dirigentes
- ✅ Alertas de éxito/error

---

## 🎨 INTERFAZ DE USUARIO

### **Pantalla Principal**
- 📊 Header con botón "Nuevo Dirigente"
- 🔍 Buscador de dirigentes
- 📋 Lista de dirigentes con cards

### **Formulario de Registro**
1. **Selector de Tipo**: 
   - Promover Scout (selecciona de lista)
   - Dirigente Externo (formulario completo)

2. **Campos Scout Existente**:
   - Dropdown con scouts activos

3. **Campos Dirigente Externo**:
   - Nombres, Apellidos
   - Tipo y N° Documento
   - Fecha de Nacimiento, Sexo
   - Contacto (celular, correo)
   - Dirección

4. **Datos de Dirigente** (común):
   - Cargo (dropdown)
   - Fecha de Inicio
   - N° Credencial (opcional)
   - Ramas Asignadas (checkboxes)
   - Responsable Principal (checkbox)
   - Especialidades (texto separado por comas)
   - Certificaciones (texto separado por comas)
   - Observaciones (textarea)

### **Lista de Dirigentes**
- Card por dirigente con:
  - Nombre completo
  - Número de credencial
  - Cargo
  - Teléfono y correo
  - Fecha de inicio
  - Especialidades (badges)
  - Botones: Ver, Editar

---

## 🔄 DIFERENCIAS CON REGISTRO SCOUT

### **Lo que FUNCIONA BIEN ahora:**
✅ **Un solo componente** en lugar de 5 archivos antiguos  
✅ **Formulario simple** con campos mínimos necesarios  
✅ **Lógica en el backend** - frontend solo llama a función SQL  
✅ **Sin campos complejos** de salud, religión, etc.  
✅ **Selector de tipo claro** - scout vs externo  
✅ **Validación automática** en función SQL  
✅ **Sin problemas de mapeo** - nombres consistentes  

### **Lo que ELIMINAMOS:**
❌ Campos religiosos  
❌ Campos médicos complejos  
❌ Editor de familiares  
❌ Múltiples modales  
❌ Lógica duplicada frontend/backend  
❌ 5 componentes legacy diferentes  

---

## 🚀 PRÓXIMOS PASOS

### **1. Ejecutar SQL** (TÚ)
```bash
# Copia database/api_registrar_dirigente.sql
# Pégalo en Supabase SQL Editor
# Ejecuta
```

### **2. Probar en UI**
- Ir a sección "Dirigentes" en el menú
- Intentar registrar un scout como dirigente
- Intentar registrar un dirigente externo
- Verificar que aparezca en la lista

### **3. Verificar Datos**
```sql
-- Ver dirigentes creados
SELECT * FROM dirigentes;

-- Ver roles asignados
SELECT * FROM roles_persona WHERE tipo_rol = 'DIRIGENTE';

-- Ver asignaciones de ramas
SELECT * FROM asignaciones_dirigente_rama;
```

---

## ❓ TROUBLESHOOTING

### Error: "La función no existe"
→ No ejecutaste el script SQL en Supabase

### Error: "Scout no encontrado"
→ El scout_id no existe o está INACTIVO

### Error: "Persona ya es dirigente"
→ Ya existe un registro activo para esa persona

### Error: "Documento duplicado"
→ Ya existe una persona con ese número de documento

---

## 📝 EJEMPLOS DE USO

### **Ejemplo 1: Promover un Scout**
1. Click en "Nuevo Dirigente"
2. Seleccionar "Promover Scout"
3. Elegir scout del dropdown
4. Seleccionar cargo: "Jefe de Rama"
5. Marcar ramas: Manada, Tropa
6. Marcar "Responsable Principal"
7. Especialidades: "Primeros Auxilios, Campismo"
8. Click "Registrar Dirigente"

### **Ejemplo 2: Dirigente Externo**
1. Click en "Nuevo Dirigente"
2. Seleccionar "Dirigente Externo"
3. Llenar datos personales:
   - Nombres: Carlos
   - Apellidos: García López
   - DNI: 45678901
   - Fecha nacimiento: 20/08/1985
   - Celular: 987654321
4. Llenar datos dirigente:
   - Cargo: Asesor
   - Rama: Rovers
   - Certificaciones: Formación Básica, Seguridad
5. Click "Registrar Dirigente"

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de considerar completa la implementación:

- [ ] Script SQL ejecutado en Supabase
- [ ] Función `api_registrar_dirigente` existe
- [ ] Componente RegistroDirigente carga sin errores
- [ ] Puedo ver la lista de scouts en el dropdown
- [ ] Puedo registrar un scout como dirigente
- [ ] Puedo registrar un dirigente externo
- [ ] Los dirigentes aparecen en la lista
- [ ] El buscador funciona
- [ ] Las ramas se asignan correctamente

---

## 🎉 RESULTADO FINAL

**Sistema simplificado y funcional que:**
- ✅ Maneja ambos casos (scout y externo) en un solo flujo
- ✅ Evita duplicación de código y lógica
- ✅ Usa arquitectura personas + roles correctamente
- ✅ Tiene validaciones completas en backend
- ✅ UI clara y fácil de usar
- ✅ Sin los problemas del módulo de scouts

---

**¡Ejecuta el script SQL y prueba el nuevo sistema! 🚀**
