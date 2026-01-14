# 📱 Registro Rápido de Scouts en Mobile

## 🎯 Objetivo

Permitir el registro rápido de scouts desde el campo usando dispositivos móviles, siguiendo las mejores prácticas de UX mobile.

---

## ✨ Características Implementadas

### 1. **Formulario Multi-Paso** (3 Pasos)

Siguiendo la política de UX que indica: *"Formularios multi-paso para mobile en lugar de un formulario gigante scrolleable"*

#### **Paso 1: Datos Personales** (5 campos)
- ✅ Nombres *
- ✅ Apellidos *
- ✅ Sexo * (botones táctiles grandes: Masculino/Femenino)
- ✅ Fecha de Nacimiento *
- ✅ Número de Documento (opcional)

#### **Paso 2: Datos Scout** (1 campo)
- ✅ Rama * (4 botones con colores distintivos)
- ✅ Estado: ACTIVO (automático, no editable)

#### **Paso 3: Confirmación**
- ✅ Resumen visual de todos los datos
- ✅ Botón de confirmación destacado

### 2. **UX Optimizada para Mobile**

- ✅ **Barra de progreso visual:** "Paso 1/3, 2/3, 3/3"
- ✅ **Indicador de progreso:** Barras horizontales animadas
- ✅ **Botones grandes para touch:** 44x44px mínimo
- ✅ **Colores distintivos por rama:**
  - Manada: Amarillo
  - Tropa: Verde
  - Comunidad: Naranja
  - Clan: Azul
- ✅ **Navegación clara:** Botones "Siguiente" y "Anterior" siempre visibles
- ✅ **Validación por paso:** No avanza si faltan datos obligatorios
- ✅ **Mensajes de error:** Claros y específicos

### 3. **Integración en ScoutsScreen**

#### **Botón CTA Destacado**
- Ubicación: Header del módulo Scouts
- Estilo: Botón blanco sobre gradiente azul
- Icono: UserPlus de Lucide React
- Texto: "Nuevo"

#### **Estado Vacío Significativo**
Siguiendo política UX: *"Estados vacíos con ilustración, título descriptivo, mensaje explicativo y CTA claro"*

```tsx
<div className="estado-vacio">
  <IconoCircular /> {/* Users icon en círculo azul */}
  <Titulo>No hay scouts registrados</Titulo>
  <Mensaje>Comienza registrando el primer scout del grupo</Mensaje>
  <BotonCTA>Registrar Primer Scout</BotonCTA>
</div>
```

---

## 📂 Archivos Creados/Modificados

### **Nuevo Componente:**
- ✅ `src/components/Mobile/RegistroScoutRapido.tsx` (408 líneas)
  - Formulario multi-paso completo
  - Validación por paso
  - Integración con ScoutService
  - UX optimizada para mobile

### **Modificaciones:**
- ✅ `src/components/Mobile/ScoutsScreen.tsx`
  - Import de RegistroScoutRapido
  - Estado `mostrarRegistro`
  - Botón "Nuevo" en header
  - Modal de registro con callbacks
  - Estado vacío mejorado

- ✅ `src/services/scoutService.ts`
  - Método `createScout()` (nuevo alias)
  - Normalización de sexo (M/F → MASCULINO/FEMENINO)
  - Compatibilidad con campos mobile

---

## 🚫 Campos NO Incluidos en Mobile

Según las políticas UX, el registro mobile es **mínimo viable**. Los siguientes campos se completan después en la web:

- ❌ Código asociado (se genera automático)
- ❌ Dirección completa (solo distrito en web)
- ❌ Familiares adicionales
- ❌ Centro de estudios
- ❌ Ocupación
- ❌ Correo institucional
- ❌ Grupo sanguíneo
- ❌ Seguro médico
- ❌ Discapacidades

**Justificación:** En campo, el dirigente necesita registrar rápido. Los datos administrativos se completan con más tiempo en la oficina.

---

## 🎨 Diseño de Interfaz

### **Colores y Estilos**

```tsx
// Header del modal
background: gradient(blue-500 → blue-600)
color: white

// Botones de sexo
Masculino: border-blue-500, bg-blue-50, text-blue-700
Femenino: border-pink-500, bg-pink-50, text-pink-700

// Botones de rama
Manada:    border-yellow-500, bg-yellow-50
Tropa:     border-green-500, bg-green-50
Comunidad: border-orange-500, bg-orange-50
Clan:      border-blue-500, bg-blue-50

// Botón CTA (Siguiente/Registrar)
background: gradient(blue-600 → blue-700)
color: white
active:scale-95 (efecto táctil)

// Botón Anterior
border: 2px solid gray-300
color: gray-700
```

### **Jerarquía Visual**

1. **Título del paso** → Grande, bold
2. **Instrucción** → Mediano, normal
3. **Campos de input** → Con labels claros
4. **Botones de acción** → Destacados con gradientes
5. **Botones secundarios** → Outline con border

---

## 🔄 Flujo de Usuario

```
┌─────────────────────────┐
│   ScoutsScreen          │
│   [Botón "Nuevo"]       │ ──┐
└─────────────────────────┘   │
                              │ onClick
                              ↓
┌─────────────────────────────────────┐
│   RegistroScoutRapido (Modal)       │
│   ┌─────────────────────────────┐   │
│   │ PASO 1: Datos Personales    │   │
│   │ - Nombres                   │   │
│   │ - Apellidos                 │   │
│   │ - Sexo [M] [F]             │   │
│   │ - Fecha Nacimiento          │   │
│   │ - Documento (opcional)      │   │
│   │         [Siguiente →]       │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
                ↓ validarPaso1()
┌─────────────────────────────────────┐
│   PASO 2: Datos Scout               │
│   ┌─────────────────────────────┐   │
│   │ [Manada] [Tropa]            │   │
│   │ [Comunidad] [Clan]          │   │
│   │                             │   │
│   │ Estado: ACTIVO (auto)       │   │
│   │                             │   │
│   │ [← Anterior] [Siguiente →]  │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
                ↓ validarPaso2()
┌─────────────────────────────────────┐
│   PASO 3: Confirmación              │
│   ┌─────────────────────────────┐   │
│   │ ✓ Resumen Visual            │   │
│   │                             │   │
│   │ Juan Carlos Pérez García    │   │
│   │ Masculino | 15/05/2010      │   │
│   │ Rama: Tropa                 │   │
│   │                             │   │
│   │ [← Anterior]                │   │
│   │ [✅ Registrar Scout]        │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
                ↓ handleRegistrar()
┌─────────────────────────────────────┐
│   ScoutService.createScout()        │
│   → api_registrar_scout (Supabase)  │
└─────────────────────────────────────┘
                ↓ success
┌─────────────────────────────────────┐
│   onSuccess()                       │
│   - Cerrar modal                    │
│   - Recargar lista (cargarScouts)   │
│   - Mostrar nuevo scout             │
└─────────────────────────────────────┘
```

---

## 🛡️ Validaciones Implementadas

### **Paso 1: Datos Personales**
```typescript
✓ Nombres: trim(), no vacío
✓ Apellidos: trim(), no vacío
✓ Sexo: M o F seleccionado
✓ Fecha Nacimiento: date válido, ≤ hoy
✓ Documento: opcional (no valida)
```

### **Paso 2: Datos Scout**
```typescript
✓ Rama: una de las 4 opciones seleccionada
✓ Estado: ACTIVO (fijo)
```

### **Paso 3: Confirmación**
```typescript
✓ Revisión visual (sin validación adicional)
```

---

## 📊 Datos Enviados al Backend

```typescript
{
  // Datos personales
  nombres: string,
  apellidos: string,
  sexo: 'M' | 'F',  // Se normaliza a MASCULINO/FEMENINO
  fecha_nacimiento: 'YYYY-MM-DD',
  tipo_documento: 'DNI',  // Por defecto
  numero_documento?: string,  // Opcional
  
  // Datos scout
  rama_actual: 'Manada' | 'Tropa' | 'Comunidad' | 'Clan',
  estado: 'ACTIVO',
  es_dirigente: false,
  fecha_ingreso: 'YYYY-MM-DD',  // Hoy
  
  // Valores por defecto
  departamento: 'Lima',
  provincia: 'Lima',
  distrito: 'Lima'
}
```

---

## 🧪 Casos de Prueba

### **1. Registro Exitoso**
- [x] Llenar todos los campos obligatorios
- [x] Navegar 3 pasos
- [x] Confirmar registro
- [x] Verificar que aparece en lista
- [x] Verificar que modal se cierra

### **2. Validación Paso 1**
- [x] Intentar avanzar sin nombre → error
- [x] Intentar avanzar sin apellidos → error
- [x] Intentar avanzar sin sexo → error
- [x] Intentar avanzar sin fecha → error

### **3. Validación Paso 2**
- [x] Intentar avanzar sin rama → error

### **4. Navegación**
- [x] Botón "Anterior" vuelve al paso previo
- [x] Datos persisten al volver atrás
- [x] Botón "Cancelar" en paso 1 cierra modal

### **5. Estado Vacío**
- [x] Sin scouts → muestra estado vacío
- [x] Con filtro activo → mensaje diferente
- [x] Botón CTA abre registro

---

## 📱 Compatibilidad Mobile

- ✅ Touch targets ≥ 44x44px
- ✅ Scroll suave en contenido largo
- ✅ Modal responsive (max-w-md)
- ✅ Teclado numérico para fecha
- ✅ Teclado alfanumérico para texto
- ✅ `overflow-y-auto` en modal para pantallas pequeñas

---

## 🚀 Próximos Pasos

### **Pendientes:**
1. **Probar en iPhone/Android real** (actualmente solo desktop)
2. **Agregar foto del scout** (opcional en paso 1 o 2)
3. **Validar número de documento** con API RENIEC (Perú)
4. **Agregar familiar básico** (opcional paso 2.5: nombre y teléfono)
5. **Toast de confirmación** visual al registrar

### **Mejoras Futuras:**
- Modo offline (guardar en localStorage)
- Sincronización cuando hay conexión
- Escanear QR de DNI para auto-llenar
- Firma digital del apoderado

---

## 📖 Referencias

- **Políticas UX:** `.github/copilot-instructions.md`
- **Formulario Web:** `src/components/RegistroScout/RegistroScout.tsx`
- **Service Layer:** `src/services/scoutService.ts`
- **Procedimiento Campos:** Sección "Agregar Nuevos Campos" en políticas

---

## ✅ Cumplimiento de Políticas UX

| Política | Implementado |
|----------|--------------|
| Jerarquía visual clara | ✅ Botón CTA destacado, títulos prominentes |
| Estados vacíos significativos | ✅ Ilustración + mensaje + CTA |
| Flujos optimizados | ✅ Multi-paso en lugar de formulario largo |
| Filtros inline | ✅ Búsqueda y rama en ScoutsScreen |
| Feedback visual | ✅ Mensajes de error, loading states |
| Diseño responsive | ✅ Mobile-first, touch-friendly |
| Patrones de navegación | ✅ Breadcrumbs implícitos (Paso X/3) |

---

## 🎉 Resultado Final

**Antes:**
- Sin botón de registro en mobile
- Scouts tenían que registrarse desde la web
- Proceso lento en campo

**Después:**
- Botón "Nuevo" destacado en header
- Registro rápido en 3 pasos < 1 minuto
- UX optimizada para touch
- Validación en tiempo real
- Estado vacío con call-to-action
- Experiencia fluida mobile-first

---

*Documento generado: 13 de enero de 2026*
*Versión: 1.0*
