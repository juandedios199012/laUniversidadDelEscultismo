# Módulo de Seguridad — único y oficial

Este documento describe el comportamiento del sistema **después** de ejecutar la limpieza final (`database/124_limpieza_seguridad_legacy.sql`). Reemplaza a los documentos anteriores (`IMPLEMENTACION_SEGURIDAD.md`, `SECURITY_ARCHITECTURE_PROPOSAL.md`, `SECURITY_CHANGES_SUMMARY.md`) como referencia vigente — esos quedan como historial de cómo se llegó hasta acá.

## 1. Qué cambia para quien usa la web: nada

La limpieza es puramente interna (borra tablas y funciones de SQL que ya no usa nadie). Ningún flujo visible cambia:

- El login sigue igual (correo/clave, Google, código, o DNI para padres).
- El sidebar sigue mostrando los mismos módulos, con las mismas reglas de acceso.
- Seguridad → Usuarios / Roles y Permisos / Permisos Avanzados / Registro de Funcionalidades / Auditoría siguen funcionando exactamente igual.
- Un usuario puede seguir teniendo varios roles a la vez (ej. dirigente + padre_familia).

Lo único que cambia es que, de ahora en más, **hay una sola fuente de verdad** para permisos — antes había 3 sistemas coexistiendo (una versión vieja en español, una versión de permisos finos, y una whitelist aparte) y el código tenía que "saber" cuál de las tres consultar según el caso. Ahora solo hay una.

## 2. Inventario final — esto es "el" Módulo de Seguridad

| Tabla / función | Para qué sirve |
|---|---|
| `profiles` | Identidad de negocio de cada usuario (nombre, correo, DNI, activo/inactivo). 1 a 1 con `auth.users`. |
| `user_roles` | Qué rol(es) tiene cada usuario — puente muchos-a-muchos. |
| `roles` | Catálogo de roles (`super_admin`, `jefe_grupo`, `coordinador`, `dirigente`, `asistente`, `padre_familia`, `scout`) con su `nivel_jerarquia`. |
| `app_modules` | Catálogo de módulos del sistema (Scouts, Finanzas, Portal de Padres, Documentos, etc.). |
| `app_permissions` | Catálogo de permisos, formato `modulo:accion[:objeto]` (ej. `scouts:editar`, `portal_padres:leer`). |
| `role_permissions` | Qué permiso tiene otorgado cada rol. |
| `audit_log` | Historial de cambios de seguridad. |
| `check_user_permission(text)` | Función central que usan las políticas RLS y las Edge Functions para verificar un permiso. |
| `api_obtener_seguridad_usuario`, `api_listar_roles`, `api_asignar_rol`, `api_revocar_rol`, `api_obtener_matriz_permisos_rol` | RPCs que usa el frontend para roles y la matriz rápida CRUD. |
| `api_obtener_diccionario_modulos`, `api_obtener_matriz_avanzada`, `api_obtener_matriz_avanzada_rol`, `api_toggle_permiso_avanzado`, `api_registrar_modulo`, `api_registrar_permiso`, `api_eliminar_modulo`, `api_eliminar_permiso`, `api_obtener_permission_keys_usuario` | RPCs de la Matriz de Permisos Avanzados y Registro de Funcionalidades (grano fino, `permission_key`). Renombradas en `database/125_renombrar_sin_versiones.sql` — antes tenían el prefijo `api_v2_*`. |

Ninguna tabla ni función activa tiene ya "v1", "v2" ni "v3" en su nombre. Tampoco el permission_key que las protege: `seguridad:gestionar:permiso_v2` pasó a llamarse `seguridad:gestionar:funcionalidad` (mismo `id`, mismos roles que ya lo tenían otorgado — el `UPDATE` fue in-place). Ese es el estado final que pediste: **un solo módulo, sin versiones, en ningún lado**.

### Archivos de migración (histórico, no afecta el funcionamiento)

Los **archivos** `database/94_seguridad_v3_unificada.sql` y `database/94b_migrar_datos_seguridad_v3.sql` se quedan con "v3" en el nombre de archivo — son historial de migraciones ya ejecutadas (como un commit de git), no algo que la base de datos "sepa" ni que afecte el funcionamiento. No los renombré porque decenas de otros scripts de este repo ya los referencian por ese nombre en comentarios, y el objetivo real ("nada con v1/v2/v3 en la base de datos") ya se cumple sin tocarlos. Si de todas formas quieres que también se rebauticen esos archivos (y se actualicen las referencias cruzadas), decímelo y lo hago aparte.

## 3. Qué se elimina y por qué es seguro

Antes de la limpieza coexistían 3 generaciones de tablas/funciones:

- **v1** (nombres en español): `usuario_roles`, `rol_permisos`, `permisos`, `dirigentes_autorizados`, `solicitudes_acceso`, y funciones como `tiene_permiso`, `api_obtener_permisos_rol`, `api_listar_permisos`, `check_user_permission_v2`, `check_current_user_permission`.
- **v2/v3** (las de la tabla de arriba): las que sí sigue usando el frontend hoy.

Verifiqué **cada** objeto de la lista de eliminación contra el código fuente actual (`grep` sobre `src/services` y `src/components`) y confirmé que ninguno tiene referencias vivas — no van a romper nada.

⚠️ **Encontré un bug en el intento anterior de este script** (la "Parte B" comentada en `94b_migrar_datos_seguridad_v3.sql`): intentaba borrar `api_asignar_rol`, pero esa función fue **redefinida** para apuntar a las tablas nuevas y es la que usa hoy el diálogo "Asignar Roles" — borrarla habría roto la asignación de roles a usuarios. El script corregido (`database/124_limpieza_seguridad_legacy.sql`) ya no la toca.

`api_agregar_permiso_rol` / `api_quitar_permiso_rol` sí se eliminan — tienen métodos "wrapper" en `permissionsService.ts` (`agregarPermisoRol`/`quitarPermisoRol`) pero ningún componente los llama (la Matriz de Permisos usa `api_toggle_permiso_avanzado` en su lugar). Quedan como código muerto en el frontend después de la limpieza; se pueden borrar también si quieres, es opcional.

## 4. Cómo ejecutar la limpieza

1. Si no lo hiciste antes: correr la **Parte A** de `database/94b_migrar_datos_seguridad_v3.sql` (migra datos de las tablas viejas a las nuevas) y revisar el `SELECT` de verificación que trae al final — los conteos deben tener sentido (ver comentarios en ese mismo archivo).
2. Iniciar sesión como super_admin y confirmar que el sidebar, "Asignar Roles" y la Matriz de Permisos funcionan igual que siempre.
3. Sacar un backup/snapshot de la base de datos (Supabase Dashboard → Database → Backups).
4. Correr `database/124_limpieza_seguridad_legacy.sql` (tablas/funciones v1 huérfanas). Irreversible.
5. Correr `database/125_renombrar_sin_versiones.sql` (renombra las 9 funciones `api_v2_*` y el permission_key `..._v2`). Hacerlo junto con el despliegue del frontend actualizado (`src/services/seguridadService.ts` ya llama a los nombres nuevos) para no dejar una ventana donde el frontend viejo llame a nombres que ya no existen.
