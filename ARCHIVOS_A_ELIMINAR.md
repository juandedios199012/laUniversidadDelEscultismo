# Archivos propuestos para eliminar (código no alcanzable)

Listado de los **91 archivos de `src/` (30.943 líneas)** a los que no se llega desde `src/main.tsx`. Es para revisarlo antes de borrar nada.

**Cómo se obtuvo** (23-oct-2026):
- Se recorrieron todos los imports a partir de `src/main.tsx`: estáticos, `import()` dinámicos, re-exports y el alias `@/`. Todos los imports se resolvieron.
- No hay `import.meta.glob` ni `require.context`. `index.html` solo carga `/src/main.tsx` y no hay tests configurados.
- Los 91 están en git y se recuperan con `git restore <archivo>`, o desde el historial si el borrado ya se commiteó. Ninguno tiene commits posteriores al 19-ago-2026.

**Columnas**: *Líneas* · *Último commit* · *Err TS* = errores de TypeScript en el archivo · *Rev.* = ⚠️ conviene mirarlo antes de borrar.

**Cómo marcar tu decisión**: cambia `☐` por `✅` (borrar) o `❌` (conservar) en la primera columna.

---

## Resumen

| # | Grupo | Archivos | Líneas | Err TS |
|---|---|---:|---:|---:|
| 1 | Versiones viejas o duplicadas de módulos | 30 | 13.889 | 221 |
| 2 | Login / autenticación antiguos | 9 | 1.406 | 3 |
| 3 | Sistema de documentos sin conectar | 36 | 12.444 | 30 |
| 4 | Reportes PDF sin conectar | 7 | 2.238 | 1 |
| 5 | Servicios sin uso (no incluidos en otro grupo) | 1 | 473 | 0 |
| 6 | Barriles y UI sin uso | 5 | 103 | 0 |
| 7 | Pruebas y ejemplos sueltos | 3 | 390 | 0 |
| | **Total** | **91** | **30.943** | **255** |

> Líneas contadas con `wc -l`. La cifra de ~31.000 que se dio antes contaba una línea más por archivo.

> Los 3 errores de sintaxis de `AsistenciaMigrated.tsx` impiden que `tsc` revise los tipos del resto del proyecto. Al borrarlo, `tsc` vuelve a mostrar los 226 errores del código en uso.

**Dependencias que quedarían sin uso** si se borran todos: `docxtemplater`, `pizzip`, `jszip` y `@radix-ui/react-switch`.

---

## 1. Versiones viejas o duplicadas de módulos

En todos los casos, la versión que usa la app es la que no lleva sufijo (por ejemplo, `Asistencia.tsx`, `Patrullas.tsx`, `Reports.tsx`).

| ☐ | Archivo | Líneas | Último commit | Err TS | Rev. | Nota |
|---|---|---:|---|---:|:-:|---|
| ☐ | `src/components/ActividadesScout/ActividadesScout.tsx` | 6 | 2025-11-09 | 0 | ⚠️ | Toda la carpeta `ActividadesScout/` está sin uso; la app usa `ActividadesExterior/` |
| ☐ | `src/components/ActividadesScout/ActividadesScoutMigrated.tsx` | 1128 | 2026-02-04 | 4 | ⚠️ | Ídem |
| ☐ | `src/components/ActividadesScout/ActividadesScoutNew.tsx` | 1173 | 2025-11-09 | 97 | | |
| ☐ | `src/components/ActividadesScout/ActividadesScoutOld.tsx` | 706 | 2025-11-09 | 36 | | |
| ☐ | `src/components/Asistencia/AsistenciaMigrated.tsx` | 817 | 2026-05-26 | 3 (sintaxis) | | Bloquea `tsc` |
| ☐ | `src/components/Asistencia/AsistenciaMigratedOld.tsx` | 681 | 2025-11-09 | 4 | | |
| ☐ | `src/components/Asistencia/AsistenciaOptimizada.tsx` | 567 | 2026-07-01 | 7 | | |
| ☐ | `src/components/ComitePadres/ComitePadresMigrated.tsx` | 518 | 2026-02-04 | 3 | | |
| ☐ | `src/components/ComitePadres/ComitePadresOld.tsx` | 362 | 2025-11-09 | 0 | | |
| ☐ | `src/components/ComitePadres/ComitePadresSimple.tsx` | 326 | 2025-11-09 | 0 | | |
| ☐ | `src/components/GrupoScout/GrupoScout_old.tsx` | 563 | 2025-11-09 | 38 | | |
| ☐ | `src/components/LibroOro/LibroOroMigrated.tsx` | 598 | 2026-02-04 | 2 | | |
| ☐ | `src/components/LibroOro/LibroOroOld.tsx` | 343 | 2025-11-09 | 0 | | |
| ☐ | `src/components/Patrullas/PatrullasDiagnostic.tsx` | 38 | 2025-11-09 | 0 | | |
| ☐ | `src/components/Patrullas/PatrullasMigrated.tsx` | 647 | 2026-01-30 | 2 | | |
| ☐ | `src/components/Patrullas/PatrullasOld.tsx` | 353 | 2026-01-08 | 0 | | |
| ☐ | `src/components/Patrullas/PatrullasSimple.tsx` | 246 | 2026-01-08 | 0 | | |
| ☐ | `src/components/ProgramaSemanal/ProgramaSemanalDiagnostic.tsx` | 38 | 2025-11-09 | 0 | | |
| ☐ | `src/components/ProgramaSemanal/ProgramaSemanalMigrated.tsx` | 584 | 2026-02-04 | 9 | | |
| ☐ | `src/components/ProgramaSemanal/ProgramaSemanalOld.tsx` | 404 | 2026-01-08 | 0 | | |
| ☐ | `src/components/ProgramaSemanal/ProgramaSemanalSimple.tsx` | 325 | 2026-01-08 | 0 | | |
| ☐ | `src/components/Reports/ReportsDashboard.tsx` | 864 | 2026-08-19 | 5 | | Duplicado de `ReportsMigrated.tsx` (mismo tamaño) |
| ☐ | `src/components/Reports/ReportsMigrated.tsx` | 864 | 2026-08-19 | 5 | | |
| ☐ | `src/components/GestionScouts/ListaScouts.tsx` | 594 | 2026-08-19 | 2 | | La app usa `RegistroScout/` |
| ☐ | `src/components/Dashboard.tsx` | 12 | 2026-02-04 | 0 | | La app usa `components/Dashboard/Dashboard.tsx` |
| ☐ | `src/components/Layout/GrupoScoutHeader.tsx` | 93 | 2025-11-12 | 0 | | Depende de `GrupoScoutContext` (sin uso) |
| ☐ | `src/contexts/GrupoScoutContext.tsx` | 257 | 2025-11-12 | 0 | ⚠️ | Contexto multi-tenant que nunca se montó |
| ☐ | `src/services/grupoScoutService.ts` | 221 | 2025-11-09 | 4 | | |
| ☐ | `src/services/userGrupoScoutService.ts` | 305 | 2025-11-12 | 0 | | |
| ☐ | `src/services/actividadesService.ts` | 256 | 2025-11-09 | 0 | | Usado solo por `ActividadesScout/` |

## 2. Login / autenticación antiguos

La app usa `components/Auth/LoginScreen.tsx` + `contexts/AuthContext.tsx`.

| ☐ | Archivo | Líneas | Último commit | Err TS | Rev. | Nota |
|---|---|---:|---|---:|:-:|---|
| ☐ | `src/components/Auth/Login.tsx` | 142 | 2026-02-04 | 0 | | |
| ☐ | `src/components/Auth/LoginPage.tsx` | 397 | 2025-11-12 | 0 | | |
| ☐ | `src/components/Auth/LoginWithOtp.tsx` | 260 | 2026-02-04 | 0 | | Tiene cambios sin commitear de hoy (arreglo de tipos) |
| ☐ | `src/components/Auth/LoginWithPassword.tsx` | 112 | 2026-02-04 | 0 | | |
| ☐ | `src/pages/LoginPage.tsx` | 397 | 2025-11-12 | 0 | | |
| ☐ | `src/components/ProtectedRoute.tsx` | 11 | 2026-02-04 | 0 | | Tiene cambios sin commitear de hoy (arreglo de tipos) |
| ☐ | `src/context/UserContext.tsx` | 42 | 2026-02-04 | 3 | | Carpeta `context/` (singular); la app usa `contexts/` |
| ☐ | `src/services/supabaseClient.ts` | 6 | 2026-02-04 | 0 | | Duplicado de `src/lib/supabase.ts` |
| ☐ | `src/components/ui/LoadingSpinner.tsx` | 39 | 2025-11-12 | 0 | | Usado solo por los logins antiguos |

## 3. Sistema de documentos sin conectar ⚠️

Arquitectura "Clean Architecture" para generar Word/PDF (Anexo 3, DNGI-03) que nunca se conectó a la app. Hoy la app genera esos documentos con `@react-pdf/renderer` desde `src/modules/reports/` (incluido `DNGI03Template.tsx` y `DNGI03WordTemplate.ts`, que **sí** se usan). **Es el único grupo que podría ser trabajo pendiente y no código muerto.**

| ☐ | Archivo | Líneas | Último commit | Err TS |
|---|---|---:|---|---:|
| ☐ | `src/domain/entities/Common.ts` | 368 | 2025-11-09 | 0 |
| ☐ | `src/domain/entities/DocumentData.ts` | 251 | 2026-05-21 | 0 |
| ☐ | `src/domain/entities/DocumentTemplate.ts` | 201 | 2025-11-09 | 0 |
| ☐ | `src/domain/repositories/DocumentRepository.ts` | 78 | 2025-11-09 | 1 |
| ☐ | `src/domain/services/DocumentGenerationService.ts` | 51 | 2025-11-09 | 1 |
| ☐ | `src/application/mappers/DocumentDataMapper.ts` | 225 | 2026-08-19 | 5 |
| ☐ | `src/application/use-cases/GenerateDocumentUseCase.ts` | 254 | 2025-11-09 | 4 |
| ☐ | `src/infrastructure/document-engines/DocxDocumentEngine.ts` | 362 | 2025-11-09 | 8 |
| ☐ | `src/infrastructure/document-engines/IDocumentEngine.ts` | 30 | 2025-11-09 | 0 |
| ☐ | `src/infrastructure/factories/Anexo3DocumentFactory.ts` | 375 | 2025-11-09 | 2 |
| ☐ | `src/infrastructure/repositories/TemplateRepository.ts` | 270 | 2025-11-09 | 0 |
| ☐ | `src/infrastructure/templates/Anexo3PersonalDataTemplate.ts` | 413 | 2025-11-09 | 0 |
| ☐ | `src/infrastructure/templates/DNGI03InstitutionalRegistrationTemplate.ts` | 600 | 2025-11-09 | 0 |
| ☐ | `src/components/documents/Anexo3DocumentGenerator.tsx` | 378 | 2025-11-09 | 1 |
| ☐ | `src/components/documents/BulkDocumentGenerator.tsx` | 492 | 2026-08-19 | 0 |
| ☐ | `src/components/documents/DNGI03DocumentGenerator.tsx` | 519 | 2025-11-09 | 4 |
| ☐ | `src/components/documents/DNGI03Generator.tsx` | 365 | 2026-05-21 | 0 |
| ☐ | `src/components/documents/TableDesigner.tsx` | 1308 | 2026-05-21 | 0 |
| ☐ | `src/components/documents/TemplateManager.tsx` | 500 | 2026-05-21 | 4 |
| ☐ | `src/config/TemplateConfig.ts` | 348 | 2026-05-21 | 0 |
| ☐ | `src/services/tableDesignService.ts` | 273 | 2025-11-12 | 0 |
| ☐ | `src/services/tableCellImageService.ts` | 540 | 2026-01-07 | 0 |
| ☐ | `src/utils/BulkDocumentUtils.ts` | 164 | 2025-11-09 | 0 |
| ☐ | `src/utils/DocumentGenerationStrategy.ts` | 320 | 2025-11-09 | 0 |
| ☐ | `src/utils/DynamicDocumentAdapter.ts` | 424 | 2026-05-21 | 0 |
| ☐ | `src/utils/DynamicPDFGenerator.ts` | 212 | 2025-11-12 | 0 |
| ☐ | `src/utils/DynamicWordGenerator.ts` | 196 | 2026-05-21 | 0 |
| ☐ | `src/utils/EnhancedPDFGenerator.ts` | 319 | 2025-11-09 | 0 |
| ☐ | `src/utils/EnhancedWordGenerator.ts` | 378 | 2026-05-21 | 0 |
| ☐ | `src/utils/FileDownloadUtils.ts` | 835 | 2025-11-09 | 0 |
| ☐ | `src/utils/HTMLTemplateGenerator.ts` | 460 | 2025-11-09 | 0 |
| ☐ | `src/utils/WordTemplateUtils.ts` | 139 | 2025-11-09 | 0 |
| ☐ | `src/demo/DocumentSystemDemo.tsx` | 246 | 2025-11-09 | 0 |
| ☐ | `src/pages/PDFDesignerPage.tsx` | 110 | 2026-01-07 | 0 |
| ☐ | `src/modules/reports/components/ReportPreview.tsx` | 314 | 2026-07-11 | 0 |
| ☐ | `src/types/index.ts` | 126 | 2026-05-26 | 0 |

## 4. Reportes PDF sin conectar

Plantillas de `modules/reports` que ningún componente usa. Las demás plantillas de esa carpeta (≈20) **sí** se usan y no se tocan.

| ☐ | Archivo | Líneas | Último commit | Err TS | Rev. | Nota |
|---|---|---:|---|---:|:-:|---|
| ☐ | `src/modules/reports/templates/pdf/DNGI03Template_OLD_BACKUP.tsx` | 325 | 2026-01-07 | 0 | | Backup; la versión en uso es `DNGI03Template.tsx` |
| ☐ | `src/modules/reports/templates/pdf/DNGI03MasivoTemplate.tsx` | 757 | 2026-04-16 | 0 | ⚠️ | El DNGI-03 masivo en uso va por `masiveReportService.ts` |
| ☐ | `src/modules/reports/templates/pdf/AttendanceByScoutTemplate.tsx` | 384 | 2026-05-26 | 0 | ⚠️ | Reporte de asistencia por scout, junto con el servicio de abajo |
| ☐ | `src/services/reporteAsistenciaService.ts` | 161 | 2026-06-13 | 1 | ⚠️ | Usa `AttendanceByScoutTemplate`; nadie lo llama |
| ☐ | `src/modules/reports/templates/pdf/ProgressReportTemplate.tsx` | 320 | 2026-03-07 | 0 | | |
| ☐ | `src/modules/reports/templates/pdf/ScoutReportTemplate.tsx` | 195 | 2026-01-07 | 0 | | |
| ☐ | `src/pages/ReportsPage.tsx` | 96 | 2026-01-07 | 0 | | "Página de ejemplo" del módulo de reportes |

## 5. Servicios sin uso

| ☐ | Archivo | Líneas | Último commit | Err TS | Nota |
|---|---|---:|---|---:|---|
| ☐ | `src/services/libroOroService.ts` | 473 | 2025-11-09 | 0 | `LibroOro.tsx` en uso no lo importa |

> Otros servicios sin uso ya figuran en sus grupos: `actividadesService`, `grupoScoutService`, `userGrupoScoutService` (§1), `supabaseClient` (§2), `tableDesignService`, `tableCellImageService` (§3) y `reporteAsistenciaService` (§4).

## 6. Barriles y UI sin uso

Archivos `index.ts` que solo re-exportan, y componentes que nadie importa (los módulos se importan por ruta directa). Borrarlos no tiene ningún efecto.

| ☐ | Archivo | Líneas | Último commit | Err TS | Nota |
|---|---|---:|---|---:|---|
| ☐ | `src/components/ui/index.ts` | 33 | 2026-01-27 | 0 | Barril de shadcn/ui |
| ☐ | `src/components/ui/switch.tsx` | 29 | 2026-01-30 | 0 | Único uso de `@radix-ui/react-switch` |
| ☐ | `src/components/Seguridad/index.ts` | 5 | 2026-02-04 | 0 | Barril |
| ☐ | `src/components/PortalPadres/index.ts` | 5 | 2026-05-27 | 0 | Barril |
| ☐ | `src/modules/reports/index.ts` | 31 | 2026-07-11 | 0 | Barril del módulo de reportes |

> Nota: `switch.tsx` es un componente shadcn estándar. Si prevés usar interruptores pronto, puedes conservarlo.

## 7. Pruebas y ejemplos sueltos

| ☐ | Archivo | Líneas | Último commit | Err TS | Nota |
|---|---|---:|---|---:|---|
| ☐ | `src/App.test.tsx` | 16 | 2026-01-08 | 0 | No hay test runner configurado |
| ☐ | `src/App_test.tsx` | 31 | 2025-11-09 | 0 | |
| ☐ | `src/modules/reports/USAGE_EXAMPLES.tsx` | 343 | 2026-07-11 | 0 | Ejemplos de uso; el `README.md` del módulo los referencia |

---

## Pasos después de la revisión

1. Borrar los archivos marcados con ✅ (`git rm`).
2. Si se borra todo el §3: `npm uninstall docxtemplater pizzip jszip`. Si se borra `switch.tsx`: `npm uninstall @radix-ui/react-switch`.
3. Verificar con `npx tsc -p tsconfig.app.json --noEmit` y `npm run build`.
4. Commit aparte para poder revertir con un solo `git revert`.
