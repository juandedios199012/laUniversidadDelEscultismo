# Stack Técnico — Sistema de Gestión Scout (Grupo Scout Lima 12)

Referencia de librerías, frameworks y decisiones técnicas del proyecto `scout-management-system`, pensada para integrar otro proyecto en este workspace.

> Generado a partir de `package.json`, archivos de configuración y el código en `src/`, `supabase/` y `database/` (oct-2026).

---

## 1. Resumen

| Capa | Tecnología |
|---|---|
| Tipo de app | SPA (Single Page Application) + PWA instalable |
| Lenguaje | TypeScript 5.5 (modo `strict`, 0 errores) |
| UI framework | React 19 |
| Bundler / dev server | Vite 6.4 |
| Estilos | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Backend (BaaS) | Supabase: PostgreSQL + Auth + Storage + Edge Functions |
| Lógica de negocio | Funciones RPC en PostgreSQL (`SECURITY DEFINER`) |
| Hosting | Azure Static Web Apps |
| CI/CD | GitHub Actions |
| Runtime | Node.js 20.18.1 (`.node-version`), npm ≥ 10 |

---

## 2. Frontend

### Núcleo
- **react** / **react-dom** `^19.2`
- **react-router-dom** `^7.17` — solo en [src/main.tsx](src/main.tsx) para rutas públicas (`/`, `/p/:token`, `/e/:codigo`) y `/*` → `App`. Dentro de [src/App.tsx](src/App.tsx) la navegación entre módulos usa estado (`activeModule`), no rutas.
- **typescript** `^5.5`, target ES2020, `moduleResolution: bundler`, `jsx: react-jsx`.
- Alias de imports: `@/*` → `./src/*` (definido en `tsconfig.app.json` y `vite.config.ts`).

### UI y estilos
- **tailwindcss** `^3.4` + **postcss** + **autoprefixer**; `darkMode: "class"`; colores por variables CSS HSL (estilo shadcn) más una paleta `scout.*` (manada, tropa, comunidad, clan).
- **tailwindcss-animate**, **class-variance-authority**, **clsx**, **tailwind-merge** (helper `cn` en `src/lib/utils.ts`).
- **shadcn/ui** (`components.json`: style `default`, baseColor `slate`, sin RSC). Componentes en [src/components/ui/](src/components/ui/).
- **@radix-ui/react-\*** — accordion, alert-dialog, checkbox, collapsible, dialog, dropdown-menu, label, progress, scroll-area, select, separator, slot, switch, tabs, tooltip.
- Componentes propios con estilo "Glassmorphism" (`GlassUI.tsx`).
- **lucide-react** `^0.577` (iconos; 1.x elimina íconos usados), **sonner** (toasts), **framer-motion** (animaciones), **canvas-confetti**.
- **recharts** `^2.15` (gráficos / KPIs).

### Formularios y validación
- **react-hook-form** `^7.71` + **@hookform/resolvers** + **zod** `^4` (esquemas en [src/schemas/](src/schemas/)).
- Convención: `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>` para que los campos con `.default()` tipen bien (ej. `ScoutFormApi` en `scoutFormSchema.ts`).

### Drag & drop
- **@dnd-kit/core**, **@dnd-kit/sortable**, **@dnd-kit/utilities**.

### Mapas
- **leaflet** + **react-leaflet** `^5` (CSS importado en `main.tsx`).

### Generación y exportación de documentos
| Formato | Librerías |
|---|---|
| PDF (principal) | **@react-pdf/renderer** — plantillas en `src/modules/reports/templates/pdf/` (Anexos, DNGI-03, etc.) |
| PDF (legado / tablas) | **jspdf** `^4.2` + **jspdf-autotable** (jspdf trae sus propios tipos; no usar `@types/jspdf`) |
| Lectura de PDF | **pdfjs-dist** |
| Word | **docx** (generación) |
| Excel | **exceljs** |
| Descarga | **file-saver** |

> react-pdf no soporta `numberOfLines` (es de React Native); para limitar líneas usar el estilo `maxLines`.
| Imágenes | **browser-image-compression** (antes de subir a Storage) |

### PWA / Offline
- **vite-plugin-pwa** + **workbox-window**: `registerType: autoUpdate`, caché `NetworkFirst` para `*.supabase.co` (24 h).
- Además existe un `public/sw.js` registrado manualmente en `main.tsx` (ojo: conviven dos service workers).

### APIs del navegador
- Web Speech API (`speechSynthesis`) para accesibilidad / texto a voz (`useTextToSpeech`, `vozAccesibilidad.ts`).
- Detección móvil (`useMobileDetect`) → renderiza `MobileApp` en lugar del layout de escritorio.

---

## 3. Backend: Supabase

- Cliente: **@supabase/supabase-js** `^2.75`, instancia única en [src/lib/supabase.ts](src/lib/supabase.ts) (`persistSession`, `autoRefreshToken`).
- **Patrón de acceso a datos**: casi todo vía RPC (`supabase.rpc(...)`, ~310 llamadas) desde la capa [src/services/](src/services/) (`*Service.ts`). Acceso directo a tablas (`supabase.from`) es minoritario.
- **Base de datos**: PostgreSQL. Scripts SQL numerados y versionados manualmente en [database/](database/) (~290 archivos: tablas, migraciones, RPCs, políticas). No se usa `supabase db migrate`; se ejecutan en orden en el SQL Editor.
  - ~167 scripts definen funciones `SECURITY DEFINER`; ~22 activan Row Level Security.
  - Fundación multi-tenant en BD (`01_multi_tenant_foundation.sql`); el frontend no tiene selector de grupo.
  - Las RPC son la fuente de verdad de los nombres de campos: varias interfaces del frontend estaban desalineadas (ej. `obtener_patrullas` devuelve `color_distintivo`). Al tipar una respuesta nueva, revisar el `json_build_object` / `RETURNS TABLE` de la función en `database/`.
  - Valores de rama en BD: `'Manada' | 'Tropa' | 'Comunidad' | 'Clan'`. Estado de asistencia en BD: mayúsculas (`'PRESENTE'`…).
- **Auth** (Supabase Auth):
  - Email + contraseña (`signInWithPassword`), magic link (`signInWithOtp`), Google OAuth (`signInWithOAuth`, `VITE_GOOGLE_CLIENT_ID`).
  - Padres/tutores inician sesión con DNI mediante un **correo sintético** `<dni>@padres.interno` ([src/lib/syntheticEmail.ts](src/lib/syntheticEmail.ts)).
  - Callback en `/auth/callback`.
- **Autorización**: roles y permisos propios en BD (`user_roles`, permisos por módulo/acción y `permission_key` tipo `"scouts:exportar:pdf"`), expuestos por `PermissionsContext` (`tienePermiso`, `can`, `puedeAcceder`).
- **Storage**: buckets de Supabase Storage (ej. `finanzas`) para documentos e imágenes.
- **Edge Functions** (Deno, en [supabase/functions/](supabase/functions/)): `admin-create-user`, `invite-user`, `delete-user`. Usan `SUPABASE_SERVICE_ROLE_KEY` como secret (nunca en el frontend). Despliegue con `supabase functions deploy <nombre>`.

---

## 4. Arquitectura del código (`src/`)

```
src/
├── main.tsx / App.tsx       # Bootstrap, rutas públicas, shell de módulos
├── components/<Modulo>/     # Un directorio por módulo funcional (Asistencia, Finanzas, Inventario, Progresion, PortalPadres, ...)
├── components/ui/           # shadcn/ui + componentes base
├── contexts/                # AuthContext, PermissionsContext
├── services/                # Acceso a Supabase (RPC) por dominio
├── hooks/                   # Hooks reutilizables
├── schemas/                 # Esquemas zod
├── modules/                 # Módulos autocontenidos (reports, inventario)
├── lib/ · utils/            # Utilidades (cliente Supabase, fechas, importación Excel)
└── config/                  # Config de dev (bypass de auth), plantillas
shared/                      # Paquete @scout/shared: tipos compartidos Web/Mobile
```

---

## 5. Variables de entorno

Prefijo `VITE_` (expuestas al cliente por Vite). Ver `.env.example`.

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (obligatoria) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon (obligatoria) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth |
| `VITE_APP_URL` | URL pública para callbacks de auth |
| `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_DEBUG_MODE`, `VITE_ENABLE_ANALYTICS` | Config general |
| `VITE_DEV_SKIP_AUTH` / `VITE_DEV_EMAIL` + `VITE_DEV_PASSWORD` | Solo local: bypass de UI o auto-login real |

---

## 6. Scripts, build y despliegue

```bash
npm install          # .npmrc usa legacy-peer-deps=true
npm run dev          # Vite en http://localhost:3000
npm run build        # limpia dist y node_modules/.vite, luego vite build
npm run preview
npm run lint         # eslint 9 + typescript-eslint + react-hooks + react-refresh
```

- Build en `dist/` con `manualChunks`: `vendor-react`, `vendor-supabase`, `vendor-pdf`, `vendor-ui`.
- **CI/CD**: [.github/workflows/azure-static-web-apps-salmon-pebble-02073b20f.yml](.github/workflows/azure-static-web-apps-salmon-pebble-02073b20f.yml) — push a `main` despliega; los PRs generan entornos preview. Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`.
- **Azure SWA** ([staticwebapp.config.json](staticwebapp.config.json)): fallback SPA a `/index.html`, headers de seguridad (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), 404 → `index.html`.

### Otras herramientas
- Scripts Bash de validación/diagnóstico en la raíz (`validar-sistema.sh`, `diagnostico.sh`, etc.).
- Python 3 para utilidades puntuales (`scripts/extraer_especialidades_pdf.py`).
- Colección Postman de la API (`Scout-API-Postman-Collection.json`).
- Guía de estilo UX/UI y convenciones en [.github/copilot-instructions.md](.github/copilot-instructions.md).

---

## 7. Notas para integrar otro proyecto

1. **Versiones a alinear**: React 19, Tailwind 3 (no 4, config JS clásica), Vite 6 (Vite 7 exige Node ≥ 20.19 y `.node-version` es 20.18.1), react-router 7, zod 4, Node 20.
2. **Dependencias peer**: la instalación depende de `legacy-peer-deps=true`; un proyecto que comparta `node_modules` heredará este comportamiento.
3. **Alias `@/`** apunta a `src/` de este proyecto; si el nuevo proyecto usa el mismo alias, conviene un monorepo con workspaces (npm workspaces) y alias distintos, o reutilizar `shared/` (`@scout/shared`) para tipos comunes.
4. **Supabase compartido**: si el nuevo proyecto usa la misma BD, debe reutilizar las RPCs existentes y respetar los roles/permisos y el modelo multi-tenant; los nuevos scripts SQL deben seguir la numeración de `database/`.
5. **Hosting**: Azure SWA sirve un solo `dist/`. Un segundo frontend necesitaría otra Static Web App, o servirse bajo una subruta ajustando `base` de Vite y `navigationFallback`.
6. **Service workers**: el caché PWA puede interferir con otra app en el mismo origen (`scope: '/'`).
7. **Sin test runner configurado**: no hay Vitest/Jest en `package.json`. La verificación hoy es `npx tsc -p tsconfig.app.json --noEmit` (0 errores) + `npm run build`.
8. **ESLint**: el script `lint` existe, pero no hay `eslint.config.js` en la raíz.
9. **Vite no revisa tipos** en `build`: un error de TypeScript no rompe el deploy. Conviene correr `tsc` en CI para no volver a acumular errores.
10. **Limpieza (oct-2026)**: se eliminaron 91 archivos no alcanzables desde `main.tsx` y las dependencias que solo ellos usaban; el detalle está en [ARCHIVOS_A_ELIMINAR.md](ARCHIVOS_A_ELIMINAR.md). Se quitaron además `@tremor/react`, `react-beautiful-dnd`, `react-icons`, `html2canvas` (directa) y `@types/jspdf`.
