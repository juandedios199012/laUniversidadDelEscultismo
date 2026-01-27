# Implementación Shadcn/ui + React Hook Form + Zod

## Fecha: 26 de enero de 2026
## Módulo Piloto: Registro Scout

---

## 📦 Instalación de Dependencias

Ejecutar en terminal:

```bash
npm install react-hook-form zod @hookform/resolvers \
  @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs \
  @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-accordion \
  @radix-ui/react-separator @radix-ui/react-scroll-area @radix-ui/react-slot \
  class-variance-authority clsx tailwind-merge tailwindcss-animate
```

---

## 🗄️ Scripts SQL a Ejecutar

### Orden de Ejecución:

1. **Historia Médica - Schema (tablas y enums):**
   ```bash
   psql -f database/30_historia_medica_schema.sql
   ```

2. **Historia Médica - Funciones RPC:**
   ```bash
   psql -f database/31_historia_medica_functions.sql
   ```

---

## 📁 Estructura de Archivos Creados

```
src/
├── lib/
│   └── utils.ts                          # cn() + helpers
│
├── components/
│   └── ui/                               # Componentes Shadcn/ui
│       ├── index.ts                      # Barrel export
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── accordion.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       ├── dialog.tsx
│       ├── alert-dialog.tsx
│       ├── toast.tsx
│       ├── skeleton.tsx
│       ├── separator.tsx
│       ├── scroll-area.tsx
│       ├── form.tsx                      # React Hook Form integration
│       └── stepper.tsx                   # Multi-step wizard
│
├── hooks/
│   └── useToast.ts                       # Toast notifications hook
│
├── services/
│   └── historiaMedicaService.ts          # API service Historia Médica
│
└── components/RegistroScout/
    ├── schemas/
    │   ├── scoutFormSchema.ts            # Zod schemas Scout
    │   └── historiaMedicaSchema.ts       # Zod schemas Historia Médica
    │
    ├── components/
    │   ├── index.ts
    │   ├── FormFields.tsx                # Campos reutilizables
    │   ├── FormSection.tsx               # Secciones colapsables
    │   ├── DatosPersonales.tsx
    │   ├── DatosContacto.tsx
    │   ├── DatosEducacion.tsx
    │   ├── DatosReligiosos.tsx
    │   ├── DatosSalud.tsx
    │   ├── DatosScout.tsx
    │   ├── EmptyState.tsx
    │   ├── KPICards.tsx
    │   └── ScoutList.tsx
    │
    └── v2/                               # Nueva versión
        ├── index.ts
        ├── ScoutForm.tsx                 # Formulario principal
        ├── RegistroScoutPage.tsx         # Página container
        └── HistoriaMedicaWizard.tsx      # Wizard 5 pasos

database/
├── 30_historia_medica_schema.sql         # Tablas Historia Médica
└── 31_historia_medica_functions.sql      # Funciones RPC
```

---

## 🎨 Componentes UI Creados

| Componente | Descripción | Variantes |
|------------|-------------|-----------|
| `Button` | Botón con carga | default, destructive, outline, ghost, scout, success |
| `Input` | Campo texto | Con estado error |
| `Textarea` | Área texto | Con estado error |
| `Label` | Etiqueta | Con indicador requerido |
| `Select` | Dropdown | Radix Select completo |
| `Accordion` | Colapsable | Animado |
| `Card` | Tarjeta | Header, content, footer |
| `Badge` | Etiqueta | default, secondary, destructive, outline, manada, tropa, comunidad, clan |
| `Tabs` | Pestañas | List, trigger, content |
| `Dialog` | Modal | Header, footer, descripción |
| `AlertDialog` | Confirmación | Para acciones destructivas |
| `Toast` | Notificación | success, error, info |
| `Skeleton` | Loading | Placeholder |
| `Stepper` | Wizard | Pasos con estado |
| `Form` | RHF Integration | Field, Item, Label, Control, Message |

---

## 📝 Schemas de Validación

### Scout Form (7 secciones):

1. **Datos Personales:** nombres, apellidos, fecha_nacimiento, tipo_documento, numero_documento, genero
2. **Contacto:** telefono_scout, email_scout, direccion, distrito, departamento
3. **Educación:** grado_instruccion, centro_estudio, grado_estudio
4. **Religión:** religion, parroquia, fecha_bautizo
5. **Salud:** tipo_sangre, alergias, condiciones_medicas
6. **Scout:** rama, seccion, cargo, estado, codigo_asociado, fecha_ingreso

### Historia Médica (5 secciones):

1. **Cabecera:** lugar_nacimiento, estatura, peso, seguro_medico, médico_cabecera
2. **Condiciones:** nombre, tipo, fecha_diagnostico, tratamiento, activa
3. **Alergias:** nombre, tipo, severidad, reacción, tratamiento_emergencia
4. **Medicamentos:** nombre, dosis, frecuencia, via, fechas, prescrito_por
5. **Vacunas:** nombre, fecha_aplicacion, dosis, lote, establecimiento

---

## 🔧 Uso de Componentes

### Formulario con React Hook Form:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scoutFormSchema, type ScoutFormData } from './schemas/scoutFormSchema';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function MiFormulario() {
  const form = useForm<ScoutFormData>({
    resolver: zodResolver(scoutFormSchema),
    defaultValues: { nombres: '' }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="nombres"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nombres</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa nombres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Usando FormFields Helper:

```tsx
import { TextField, SelectField, DateField } from './components/FormFields';

<TextField
  name="nombres"
  label="Nombres"
  control={form.control}
  required
/>

<SelectField
  name="genero"
  label="Género"
  control={form.control}
  options={[
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' }
  ]}
/>
```

### Stepper para Wizard:

```tsx
import { Stepper, Step, StepContent, StepActions } from '@/components/ui/stepper';

<Stepper activeStep={currentStep} steps={steps}>
  <Step index={0} title="Datos" onStepClick={setStep}>
    <StepContent index={0}>
      {/* Contenido paso 1 */}
    </StepContent>
  </Step>
</Stepper>
```

---

## 🚀 Migración Gradual

### Para usar la nueva versión:

```tsx
// En App.tsx o router
import { RegistroScoutPageV2 } from './components/RegistroScout/v2';

// Reemplazar:
// <RegistroScout /> 
// Por:
<RegistroScoutPageV2 />
```

### Para Historia Médica:

```tsx
import { HistoriaMedicaWizard } from './components/RegistroScout/v2';

<HistoriaMedicaWizard
  personaId={scoutId}
  personaNombre="Juan Pérez"
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

---

## ✅ Checklist de Implementación

- [x] Configurar Shadcn/ui (components.json)
- [x] Actualizar Tailwind CSS con variables
- [x] Crear componentes UI (20+)
- [x] Crear schemas Zod
- [x] Refactorizar RegistroScout v2
- [x] Crear Historia Médica Wizard
- [x] Crear tablas BD
- [x] Crear funciones RPC
- [x] Crear servicio frontend
- [ ] **Instalar dependencias npm** (usuario)
- [ ] **Ejecutar scripts SQL** (usuario)
- [ ] Integrar en App.tsx
- [ ] Testing completo

---

## 📌 Notas Importantes

1. **La carpeta `v2`** permite migración gradual sin romper código existente
2. **FormFields.tsx** estandariza todos los campos para consistencia
3. **HistoriaMedicaWizard** tiene auto-guardado en localStorage
4. Los **schemas Zod** validan tanto en frontend como generan tipos TypeScript
5. Los **componentes Radix** incluyen accesibilidad ARIA por defecto

---

## 🐛 Troubleshooting

### Error: Module not found '@/...'
Verificar que `tsconfig.app.json` tenga:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: Missing peer dependency
Ejecutar instalación completa de npm.

### Los estilos no aplican
Verificar que `tailwindcss-animate` esté instalado y el plugin agregado en `tailwind.config.js`.
