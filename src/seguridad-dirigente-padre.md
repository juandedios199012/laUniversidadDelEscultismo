Resumen ejecutivo
Hay dos sistemas de permisos que conviven de verdad, pero solo uno de los dos (v1) controla el acceso real a los módulos, incluido Portal Padres. El rol de un usuario es un campo fijo asignado manualmente por un admin — no se calcula dinámicamente comparando el email del usuario contra los emails de familiares. Sin embargo, encontré un problema real de fuga de datos en la capa de RPC de Portal Padres que no depende del rol en absoluto (detalle en punto 4).

1. Relación roles ↔ módulos (dónde se define)
Sistema v1 (el que realmente gatea la navegación):

database/60_security_rbac_audit_v2.sql:170-178 — tabla roles con 7 roles fijos y su nivel_jerarquia:

super_admin=100, jefe_grupo=90, coordinador=70, dirigente=50, asistente=30, padre_familia=20, scout=10
database/60_security_rbac_audit_v2.sql:240-265 — asignación de permisos base por rol (rol_permisos). Dirigente solo tiene dashboard, scouts, patrullas, asistencia, actividades, progresion (crear/leer/editar); no incluye portal_padres.
database/93_add_portal_padres_permission.sql:58-64 y database/91_portal_padres.sql:28-35 — asignan explícitamente portal_padres:leer al rol padre_familia.
src/services/permissionsService.ts:7-12 — enum Modulo incluye 'portal_padres'.
src/contexts/PermissionsContext.tsx:166-182 — tienePermiso/puedeAcceder consultan seguridad.permisos (que viene de usuario_roles × rol_permisos).
src/components/Layout/Sidebar.tsx:37 — el ítem "Portal de Padres" en el menú está marcado modulo: 'portal_padres' (se oculta si !puedeAcceder('portal_padres')).
Sistema v2 (paralelo, NO usado para gating real):

database/85_seguridad_v2_schema.sql:33-69 — tablas app_modules, app_permissions, role_permissions_v2 con permission_key tipo modulo:accion:objeto.
src/hooks/useAbility.ts y src/components/Guard.tsx implementan el patrón can()/<Guard> descrito en archive/moduloSeguridadV2.txt, pero no se usan en ninguna parte de la app salvo el propio dashboard de administración (src/App.tsx:29,143-144 importa SeguridadV2Dashboard solo como pantalla de configuración). Confirmado con grep: useAbility solo aparece en su propio archivo y en App.tsx (import indirecto de SeguridadV2Dashboard, no del hook).
Conclusión: v2 es una "matriz de permisos" administrativa que un super_admin puede editar, pero no gatea el sidebar ni el switch de módulos de App.tsx — eso lo sigue haciendo v1 (PermissionsContext).
2. Cómo se determina el rol al iniciar sesión
Es un campo fijo, no se calcula por coincidencia de email con familiares.

src/services/permissionsService.ts:446-548 (sincronizarRolDesdeAutorizado): si el usuario no tiene filas en usuario_roles, busca su email en dirigentes_autorizados.role (línea 455-460) y copia ese valor a usuario_roles (línea 497-536). Es un mapeo 1:1 del campo role grabado al invitar al usuario (src/services/usuariosAutorizadosService.ts:118-130), no una comparación contra fichas de scouts.
src/contexts/PermissionsContext.tsx:106-122 dispara esa sincronización solo si el usuario no tiene ningún rol (login "en frío").
Asignación manual adicional: src/components/Seguridad/dialogs/AsignarRolDialog.tsx → PermissionsService.asignarRol (línea 226-250) → RPC api_asignar_rol (database/60_security_rbac_audit_v2.sql:551-596).
Dato clave del esquema: usuario_roles permite múltiples roles activos por usuario —
database/60_security_rbac_audit_v2.sql:130: UNIQUE(user_id, rol_id, rama_especifica) (no es UNIQUE(user_id)). Y api_asignar_rol (líneas 564-580) no tiene ninguna exclusión que impida asignar padre_familia a alguien que ya tiene dirigente; simplemente hace INSERT ... ON CONFLICT DO UPDATE activo=TRUE. El cálculo de permisos (tiene_permiso, línea 281-300, y obtener_permisos_usuario, línea 303-326) hace JOIN sobre todas las filas activas de usuario_roles, es decir, los permisos de múltiples roles se unen (OR), nunca se sobreescriben.

3. SEGURIDAD v1 vs v2 — qué hace cada una
v1	v2
Tablas	roles, permisos, rol_permisos, usuario_roles (database/60_security_rbac_audit.sql y su reinstalación 60_security_rbac_audit_v2.sql)	app_modules, app_permissions, role_permissions_v2 (database/85_seguridad_v2_schema.sql:33-69)
Granularidad	CRUD fijo por módulo: crear/leer/editar/eliminar/exportar/aprobar	permission_key libre tipo modulo:accion:objeto
RPC clave	api_obtener_seguridad_usuario (database/60_security_rbac_audit.sql:512, database/60_security_rbac_audit_v2.sql:501)	api_v2_obtener_permisos_usuario (database/85_seguridad_v2_schema.sql:156-176)
Consumido por frontend en	src/services/permissionsService.ts → src/contexts/PermissionsContext.tsx → App.tsx, Sidebar.tsx, todos los módulos	src/hooks/useAbility.ts + src/components/Guard.tsx → solo usados dentro del propio SeguridadV2Dashboard, no en rutas reales
UI admin	src/components/Seguridad/SeguridadDashboard.tsx	src/components/SeguridadV2/SeguridadV2Dashboard.tsx
Nota en el propio script	database/85_seguridad_v2_schema.sql:13-14: "Este script NO elimina las tablas del sistema v1. Ambos sistemas coexisten de forma independiente."	—
archive/moduloSeguridadV2.txt (líneas 1-475) es en realidad una transcripción de un prompt/plan de diseño genérico (probablemente de una conversación con IA), no documentación específica de decisiones ya tomadas en este repo — describe exactamente el patrón useAbility/Guard/matriz que efectivamente se implementó en src/hooks/useAbility.ts y src/components/SeguridadV2/, pero confirma que v2 nunca se conectó a ProtectedRoute/gating real como proponía el documento (no existe ningún <Guard permission="portal_padres:leer"> envolviendo rutas reales).

No existe combinación automática v1+v2: son independientes; v2 no "añade" nada a v1 en tiempo de ejecución para el usuario final.

4. ¿Un DIRIGENTE cuyo email coincide con un familiar obtiene automáticamente PADRE_FAMILIA?
No, no hay ningún mecanismo automático. Verificado exhaustivamente:

El paso "Familiares" del registro de scout (src/components/RegistroScout/components/DatosFamiliares.tsx, src/services/personaService.ts, database/api_crud_familiares.sql, database/55_reutilizar_persona_existente_familiares.sql, database/92_fix_familiar_correo.sql, database/fix_registro_familiar.sql) solo escribe datos de contacto (correo, telefono, etc.) en las tablas personas/familiares_scout. No hay ningún INSERT/trigger que toque usuario_roles, dirigentes_autorizados ni auth.users desde ese flujo (confirmado con grep, cero coincidencias).
El campo es_familiar_de (personaService.ts:34,121-122,187; DatosFamiliares.tsx:102,197,556-561) solo se usa para detectar personas ya existentes al tipear el DNI, es una ayuda de UX de "reutilizar persona", no otorga rol.
Otorgar padre_familia requiere acción manual explícita de un admin, por una de dos vías:
UsuariosAutorizadosService.invitarUsuario (src/services/usuariosAutorizadosService.ts:89-142) con role: 'padre_familia', sincronizado luego a usuario_roles en el primer login (permissionsService.ts:446-548).
AsignarRolDialog → api_asignar_rol (database/60_security_rbac_audit_v2.sql:551-596).
Si un admin sí hiciera esa asignación manual sobre un usuario que ya tiene dirigente, el resultado sería aditivo (ambos roles activos, unión de permisos vía usuario_roles con UNIQUE(user_id, rol_id, rama_especifica), línea 130), y no hay ninguna exclusión en api_asignar_rol que lo impida para roles administrativos.
Hallazgo real de fuga (independiente del rol)
Aunque no hay auto-otorgamiento de rol, sí existe una fuga a nivel de RPC que hace irrelevante el chequeo de rol para los datos de "Mi Familia":

database/91_portal_padres.sql:44-102 — función api_portal_padres_mis_hijos(p_user_id): obtiene el email de auth.users (línea 51-53) y devuelve los scouts cuyo familiar (personas.correo, vía familiares_scout) coincide con ese email (línea 85), sin verificar el rol del usuario en absoluto (no hay JOIN a usuario_roles/roles, ni tiene_permiso).
src/services/portalPadresService.ts:30-57 llama a esa RPC directamente vía supabase.rpc('api_portal_padres_mis_hijos', { p_user_id: userId }) — cualquier sesión Supabase autenticada puede invocarla.
src/components/PortalPadres/hooks/useMisHijos.ts:19-50 dispara ese fetch en un useEffect incondicional, apenas se monta el componente, para cualquier user.id.
src/components/PortalPadres/PortalPadresDashboard.tsx:13-31: el hook useMisHijos() se invoca en la línea 15, antes del guard if (!puedeAcceder('portal_padres')) en la línea 19. React ejecuta hooks incondicionalmente, así que la petición de red al backend ya salió antes de que el guard decida si renderiza o no.
Consecuencia: la protección de portal_padres es solo de UI (oculta el ítem del sidebar y no renderiza el resultado), pero el backend (api_portal_padres_mis_hijos) es alcanzable por cualquier usuario autenticado independientemente de su rol — el único "control de acceso" real allí es "tu email coincide con un correo de familiar registrado". En la práctica esto es consistente con la intención (si tu correo es el de un familiar, eres el padre real), pero significa que el rol padre_familia/permiso portal_padres:leer no es una barrera de seguridad de datos real, solo una barrera de visibilidad de UI — cualquier DIRIGENTE, ASISTENTE o SCOUT autenticado cuyo email coincida con un familiares_scout.correo puede obtener esos datos llamando la RPC directamente (p. ej. desde la consola del navegador con el cliente supabase ya inicializado), sin que se le haya asignado el rol padre_familia.

Bypass adicional por jerarquía de rol
src/contexts/PermissionsContext.tsx:162,177-182:


const esAdmin = nivelRolPrincipal >= 70;
const puedeAcceder = (modulo) => esSuperAdmin || esAdmin || tienePermiso(modulo, 'leer');
Cualquier usuario con nivel_jerarquia >= 70 (coordinador=70, jefe_grupo=90, super_admin=100, ver database/60_security_rbac_audit_v2.sql:171-174) obtiene acceso a TODOS los módulos, incluido portal_padres y seguridad, sin que exista una fila explícita en rol_permisos para ese módulo. Es un bypass amplio "por nivel jerárquico", separado del mecanismo de permisos por módulo. dirigente (nivel 50) queda fuera de este bypass.

5. Dónde se habilitó el permiso PADRE_FAMILIA → Portal Padres
Dos scripts SQL, ambos otorgan portal_padres:leer al rol padre_familia en el sistema v1 (rol_permisos), de forma automática/directa (no requiere clic en la matriz):

database/91_portal_padres.sql:19-35 (comentario en línea 7: "Asigna permiso portal_padres:leer al rol padre_familia"):

INSERT INTO permisos (modulo, accion, descripcion)
VALUES ('portal_padres', 'leer', 'Ver el portal de padres con datos de sus scouts')
ON CONFLICT (modulo, accion) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'padre_familia' AND p.modulo = 'portal_padres' AND p.accion = 'leer'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
database/93_add_portal_padres_permission.sql:1-22 (fix posterior, porque el CHECK constraint de la tabla permisos no incluía 'portal_padres'): amplía el constraint (líneas 30-39), inserta los 5 permisos CRUD de portal_padres (líneas 45-52) y repite la asignación a padre_familia (líneas 58-64). También amplía dirigentes_autorizados_role_check para aceptar 'padre_familia' como valor válido (líneas 71-80).
Permiso adicional más fino (v2, no auto-otorgado, solo registrado para que un super_admin lo active manualmente desde la Matriz): database/add_permiso_portal_padres_editar_perfil_hijo.sql:20-36 — crea portal_padres:editar:perfil_hijo en app_permissions, con instrucción explícita en línea 12-14 de ir a "Configuración > Seguridad > Matriz de Permisos" y activarlo manualmente.
6. archive/moduloSeguridadV2.txt y archive/UI-v3-progresion
archive/moduloSeguridadV2.txt (475 líneas, leído completo): es una transcripción de un intercambio tipo prompt-de-diseño (probablemente con un asistente IA) que propone la arquitectura v2 completa: tablas app_features/app_modules/app_permissions/role_permissions, función check_user_permission, hook useAbility, componente <Guard>, <ProtectedRoute>, matriz de permisos en Tailwind y formulario de registro de funcionalidades. Es documentación de intención/plan, no de lo que terminó ejecutándose en producción — y, como se documentó arriba, el <Guard>/useAbility resultante nunca se conectó a rutas reales.
archive/UI-v3-progresion/ contiene únicamente capturas de pantalla (.png) de mockups de UI (Dashboard, Bitácora, Análisis, Tab Portal Padres), sin código ni lógica de permisos — no aporta evidencia adicional sobre autorización.
Conclusión para el análisis de seguridad
No hay fuga por "auto-otorgamiento" de rol basado en email de familiar — eso no existe en el código.
Sí hay una fuga de datos real e independiente del rol: api_portal_padres_mis_hijos (database/91_portal_padres.sql:44-102) es alcanzable por cualquier usuario autenticado (vía portalPadresService.ts:34-37) y solo depende de la coincidencia de email, no del rol/permiso padre_familia/portal_padres:leer. El guard de permiso en PortalPadresDashboard.tsx:19 es cosmético porque el fetch (useMisHijos.ts:19-50) ya se disparó antes de evaluarlo.
El bypass esAdmin (nivel_jerarquia ≥ 70) en PermissionsContext.tsx:162,177-182 da acceso de lectura a todos los módulos —incluidos portal_padres y seguridad— a coordinador, jefe_grupo y super_admin, sin necesidad de fila explícita en rol_permisos, lo cual es una superficie de acceso amplia que vale la pena revisar si se espera que "seguridad" sea un módulo restringido incluso para coordinadores.
Un admin puede combinar manualmente dirigente + padre_familia en el mismo usuario (esquema lo permite, api_asignar_rol no lo bloquea), y los permisos se sumarían — pero esto requiere una acción deliberada, no es automático.
Ya tengo el análisis completo. Aquí está el resumen:

Respuesta directa a tu pregunta
No, no hay auto-otorgamiento automático. Si creas un usuario como DIRIGENTE y su email coincide con el de un familiar cargado en el step "Familiares" de un scout, el sistema no le asigna automáticamente el rol PADRE_FAMILIA. El rol es un campo fijo que solo se asigna manualmente (al invitar al usuario o vía "Asignar Rol"). El step Familiares solo guarda datos de contacto (correo, teléfono) — no toca usuario_roles ni auth.users.

Pero encontré una fuga real, independiente del rol
El guard de permiso en Portal Padres es solo cosmético (UI), no protege los datos reales:

database/91_portal_padres.sql:44-102 — la función api_portal_padres_mis_hijos(p_user_id) devuelve los scouts cuyo familiar tiene el mismo correo que el usuario logueado, sin verificar el rol/permiso en absoluto.
src/components/PortalPadres/hooks/useMisHijos.ts:19-50 dispara ese fetch en un useEffect incondicional.
src/components/PortalPadres/PortalPadresDashboard.tsx:13-31 — el hook se llama en la línea 15, antes del if (!puedeAcceder('portal_padres')) de la línea 19. React ejecuta el hook igual, así que la petición ya salió al backend antes de decidir si se muestra o no.
Consecuencia práctica: un DIRIGENTE (o cualquier usuario autenticado) cuyo email coincida con un familiares_scout.correo puede obtener esos datos llamando la RPC directamente (ej. desde la consola del navegador), aunque nunca se le haya asignado el rol PADRE_FAMILIA. El permiso portal_padres:leer habilitado recientemente (database/91_portal_padres.sql:19-35 y database/93_add_portal_padres_permission.sql:58-64) solo controla si se muestra el ítem en el sidebar/dashboard, no si el backend responde.

Otro hallazgo relacionado (bypass jerárquico)
src/contexts/PermissionsContext.tsx:162,177-182: cualquier usuario con nivel_jerarquia >= 70 (coordinador, jefe_grupo, super_admin) tiene acceso de lectura a todos los módulos, incluido portal_padres, sin fila explícita en rol_permisos. dirigente (nivel 50) queda fuera de este bypass.

Sobre v1 vs v2
Coexisten pero v2 no gatea nada real — solo v1 (PermissionsContext → Sidebar/App.tsx) controla el acceso efectivo. v2 (useAbility/Guard) solo se usa dentro de su propio dashboard de administración de la matriz de permisos.

¿Quieres que arregle la fuga en PortalPadresDashboard.tsx/api_portal_padres_mis_hijos (mover el check de permiso antes del fetch, y opcionalmente validar el rol dentro de la función SQL)?