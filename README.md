# 🏕️ Sistema de Gestión Boy Scout - Grupo Lima 12

## 📋 Descripción del Proyecto

Sistema web moderno y responsive para la gestión y registro de Boy Scouts del Grupo Lima 12. Desarrollado siguiendo las mejores prácticas de UX/UI con diseño inspirado en aplicaciones modernas como las que se diseñan en Figma.

## ✨ Características Principales

### 🎯 Funcionalidades Core
- **Registro de Boy Scouts** con datos personales completos
- **Gestión de Familiares** con búsqueda inteligente
- **Asignación de Ramas** según edad automática
- **Validación de Edad** por rama scout
- **Timeline de Progresión** entre ramas
- **Ubicación Geográfica** (Departamentos, Provincias, Distritos del Perú)

### 🎨 Diseño y UX
- **Diseño Responsive** compatible con móviles, tablets y desktop
- **Interfaz Moderna** inspirada en mejores prácticas de UI/UX
- **Paleta de Colores Scout** (verdes, naranjas, azules naturales)
- **Formulario Multi-paso** con indicador de progreso
- **Animaciones Suaves** y transiciones elegantes
- **Validación en Tiempo Real** de campos

### 🔧 Tecnologías Utilizadas
- **HTML5** semántico y accesible
- **CSS3** con Custom Properties (Variables CSS)
- **JavaScript Vanilla** modular y orientado a objetos
- **Font Awesome** para iconografía
- **Google Fonts** (Inter) para tipografía moderna

## 🔐 Control de Acceso y Autorización

### Flujo de Acceso al Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    APP EN AZURE                             │
│           tuapp.azurestaticapps.net                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PANTALLA DE LOGIN                       │   │
│  │         (visible para TODOS)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│              ┌──────────────────────┐                       │
│              │ Usuario ingresa su   │                       │
│              │ email y da clic      │                       │
│              └──────────────────────┘                       │
│                          │                                  │
│           ┌──────────────┴──────────────┐                   │
│           ▼                             ▼                   │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │ Email EN tabla  │         │ Email NO EN tabla       │    │
│  │ dirigentes_     │         │ dirigentes_autorizados  │    │
│  │ autorizados     │         │                         │    │
│  └────────┬────────┘         └───────────┬─────────────┘    │
│           ▼                              ▼                  │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │ ✅ ACCEDE AL    │         │ ❌ "Tu email no está    │    │
│  │   DASHBOARD     │         │    autorizado"          │    │
│  └─────────────────┘         └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### ¿Cómo funciona?

| Concepto | Descripción |
|----------|-------------|
| **URL pública** | Cualquier persona puede ver la pantalla de login |
| **Contenido protegido** | Solo usuarios en la lista blanca pueden acceder al sistema |
| **Lista blanca** | Tabla `dirigentes_autorizados` en la base de datos |

### Paso a paso para dar acceso a un nuevo usuario

| Paso | Acción |
|------|--------|
| 1 | Despliegas la app en Azure → `tuapp.azurestaticapps.net` |
| 2 | Le das la URL a la persona |
| 3 | La persona entra a la URL → **Ve la pantalla de login** |
| 4 | La persona ingresa su email y da clic en "Enviar Código" |
| 5 | El sistema verifica si el email está en `dirigentes_autorizados` |
| 6 | **Si NO está** → Mensaje "Tu email no está autorizado" |
| 7 | **Si SÍ está** → Puede entrar al sistema |

### Cómo autorizar nuevos usuarios

**Opción A: Desde la UI (recomendado)**
1. Ingresas al sistema con tu cuenta autorizada
2. Vas a **Seguridad → Usuarios → Invitar Usuario**
3. Agregas el email del nuevo dirigente
4. Seleccionas su rol (Dirigente, Admin Grupo, Super Admin)
5. ¡Listo! El nuevo usuario ya puede acceder

**Opción B: Desde SQL (solo casos especiales)**
```sql
INSERT INTO dirigentes_autorizados (email, nombre_completo, role, activo, grupo_scout_id)
VALUES (
  'nuevo.dirigente@gmail.com', 
  'Nombre Completo', 
  'dirigente',  -- o 'grupo_admin' o 'super_admin'
  true,
  (SELECT id FROM grupos_scout LIMIT 1)
);
```

### Roles disponibles

| Rol | Permisos |
|-----|----------|
| `dirigente` | Acceso básico a módulos asignados |
| `grupo_admin` | Puede gestionar dirigentes y configuración del grupo |
| `super_admin` | Acceso total al sistema |

## 📊 Estructura de Ramas Scout

| Rama | Edad | Color | Icono | Características |
|------|------|-------|-------|----------------|
| **Manada** | 7-10 años | Verde | 🐾 | Seisenas, Lobatos/Lobatas |
| **Tropa** | 11-14 años | Naranja | 🥾 | Patrullas, Guías, Scouts |
| **Caminante** | 15-17 años | Azul | 🧭 | Exploración, Liderazgo |
| **Clan** | 18-21 años | Morado | ⛰️ | Rovers, Servicio Comunitario |

## 🗂️ Estructura del Proyecto

```
laUniversidadDelEscultismo/
├── index.html                 # Página principal
├── assets/
│   ├── css/
│   │   ├── main.css          # Estilos principales
│   │   ├── components.css    # Componentes específicos
│   │   └── responsive.css    # Diseño responsive
│   └── js/
│       ├── data.js           # Datos y configuración
│       ├── main.js           # Aplicación principal
│       ├── form-steps.js     # Manejo de pasos del formulario
│       ├── form-validation.js # Validaciones
│       ├── location.js       # Manejo de ubicaciones
│       └── rama-logic.js     # Lógica de ramas scout
└── README.md                 # Documentación
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, para desarrollo)

### Instalación
1. Clona o descarga el repositorio
2. Abre `index.html` en tu navegador
3. ¡Listo para usar!

### Para Desarrollo Local
```bash
# Con Python (simple)
python -m http.server 8000

# Con Node.js (http-server)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

Luego visita: `http://localhost:8000`

## 📝 Guía de Uso

### 1. Datos Personales
- **Nombres y Apellidos**: Solo letras y espacios
- **Fecha de Nacimiento**: Calcula automáticamente la edad
- **Ubicación**: Selección en cascada (Departamento → Provincia → Distrito)
- **Contacto**: Validación de formatos peruanos
- **Foto**: Drag & drop, máximo 5MB (JPG, PNG, GIF)

### 2. Datos del Familiar
- **Búsqueda Inteligente**: Busca familiares existentes
- **Registro Nuevo**: Si no existe, se registra como nuevo
- **Parentesco**: Lista predefinida de opciones

### 3. Rama o Unidad Scout
- **Selección Automática**: Sugiere rama según edad
- **Validación de Edad**: Alerta si no corresponde
- **Campos Específicos**: Se generan dinámicamente según la rama
- **Timeline Visual**: Muestra progresión entre ramas

## 🎯 Validaciones Implementadas

### Datos Personales
- ✅ Nombres: Solo letras, mínimo 2 caracteres
- ✅ Celular: 9 dígitos, comenzando con 9
- ✅ Edad: Entre 6 y 25 años
- ✅ Archivo: Tipos permitidos y tamaño máximo

### Datos Familiares
- ✅ Campos obligatorios completados
- ✅ Formato de teléfonos válido

### Datos de Rama
- ✅ Correspondencia edad-rama
- ✅ Campos específicos obligatorios
- ✅ Fecha de ingreso válida

## 🎨 Guía de Colores

```css
/* Colores Scout */
--primary-color: #2E7D4A;      /* Verde Scout */
--secondary-color: #F4A460;     /* Dorado Scout */
--accent-color: #1976D2;        /* Azul Scout */

/* Ramas */
--manada-color: #8BC34A;        /* Verde Manada */
--tropa-color: #FF9800;         /* Naranja Tropa */
--caminante-color: #2196F3;     /* Azul Caminante */
--clan-color: #9C27B0;          /* Morado Clan */
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile Large**: 480px - 768px
- **Mobile Small**: < 480px

### Adaptaciones Móviles
- Navegación colapsible
- Formulario de una columna
- Timeline vertical
- Botones de ancho completo
- Tipografía escalable

## ⚡ Características Técnicas

### Rendimiento
- **CSS Variables** para temas dinámicos
- **Lazy Loading** de validaciones
- **Debounced Search** para búsquedas
- **Optimización de Imágenes** automática

### Accesibilidad
- **Semántica HTML** correcta
- **ARIA Labels** en elementos interactivos
- **Contraste de Colores** WCAG AA
- **Navegación por Teclado** completa
- **Screen Reader** compatible

### Compatibilidad
- **ES6+** con fallbacks
- **CSS Grid** con flexbox de respaldo
- **Progressive Enhancement**
- **Graceful Degradation**

## 🔮 Características Futuras (Roadmap)

### Fase 2
- [ ] Backend API con Node.js/Express
- [ ] Base de datos MongoDB/PostgreSQL
- [ ] Autenticación de usuarios
- [ ] Sistema de roles y permisos

### Fase 3
- [ ] Dashboard de administración
- [ ] Reportes y estadísticas
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones push

### Fase 4
- [ ] App móvil nativa
- [ ] Integración con sistemas externos
- [ ] API REST completa
- [ ] Tests automatizados

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Diseño UX/UI**: Inspirado en mejores prácticas de Figma
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Metodología**: Mobile First, Progressive Enhancement

## 📞 Contacto y Soporte

- **Grupo Scout**: Lima 12
- **Proyecto**: La Universidad del Escultismo
- **Email**: info@grupolima12.scout.pe
- **Web**: www.grupolima12.scout.pe

---

## 🏕️ ¡Siempre Listos! ⚜️

*Este sistema ha sido desarrollado con amor y dedicación para facilitar la gestión de nuestros scouts y fortalecer el movimiento scout en el Perú.*
# Actualización Sun Nov  9 04:09:20 -05 2025


# URL
https://salmon-pebble-02073b20f.1.azurestaticapps.net

---

## 📊 Tracking de Desarrollo con GitHub Copilot

### Sesión: 27 de enero de 2026 - Módulo Finanzas

| # | Hora Inicio | Hora Fin | Duración | Descripción del Prompt |
|---|-------------|----------|----------|------------------------|
| 1 | 01:45:00 | 01:55:00 | 10 min | Pregunta sobre actualización de UI "Préstamos Pendientes" al registrar egreso con préstamo |
| 2 | 01:55:00 | 02:10:00 | 15 min | Implementación de sección préstamo en formulario NuevaTransaccionDialog (checkbox, campos condicionales, validación) |
| 3 | 02:10:00 | 02:12:00 | 2 min | Creación componente Checkbox de Radix UI |
| 4 | 02:12:00 | 02:15:00 | 3 min | Instalación dependencia @radix-ui/react-checkbox |
| 5 | 02:15:00 | 02:16:00 | 1 min | Reinicio servidor local |
| 6 | 02:16:00 | 02:21:00 | 5 min | Solicitud funcionalidad ver/editar transacciones |
| 7 | 02:21:00 | 02:35:00 | 14 min | Creación DetalleTransaccionDialog (vista y edición), actualización TransaccionesTab con menú mejorado |
| 8 | 02:35:00 | 02:37:00 | 2 min | Reinicio servidor y verificación compilación |
| 9 | 02:37:00 | 02:40:00 | 3 min | Documentación tracking en README |
| 10 | 02:40:00 | 02:55:00 | 15 min | Error módulo Aire Libre "column a.codigo does not exist" - Corrección funciones SQL |
| 11 | 02:55:00 | 02:58:00 | 3 min | Reinicio servidor + actualización README con tracking |
| 12 | 02:58:00 | 03:15:00 | 17 min | Error "column p.dia_numero does not exist" - Corrección masiva de todas las funciones SQL de Actividades (programas, bloques, participantes, staff, presupuesto, documentos, menu, puntajes) |
| 13 | 03:15:00 | 03:25:00 | 10 min | Actualización interfaces TypeScript en actividadesExteriorService.ts para coincidir con schema SQL corregido |

### Resumen de la Sesión

| Métrica | Valor |
|---------|-------|
| **Hora de inicio** | 01:45:00 AM (27 enero 2026) |
| **Hora de finalización** | 03:25:00 AM (27 enero 2026) |
| **Tiempo total** | 1 hora 40 minutos |
| **Total de prompts** | 13 |
| **Promedio por prompt** | ~7.7 minutos |

### Archivos Modificados/Creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `database/42_finanzas_functions.sql` | Modificado | Actualizado api_registrar_transaccion para aceptar prestamista_nombre sin ID |
| `database/43_actividades_functions.sql` | Modificado | Corregidas TODAS las funciones SQL con columnas del schema real |
| `src/services/actividadesExteriorService.ts` | Modificado | Actualizadas interfaces TypeScript para coincidir con schema SQL |
| `src/components/Finanzas/dialogs/NuevaTransaccionDialog.tsx` | Modificado | Agregada sección préstamo con checkbox y campos condicionales |
| `src/components/ui/checkbox.tsx` | Creado | Nuevo componente Checkbox de Radix UI |
| `src/components/Finanzas/dialogs/DetalleTransaccionDialog.tsx` | Creado | Nuevo diálogo para ver/editar transacciones |
| `src/components/Finanzas/tabs/TransaccionesTab.tsx` | Modificado | Integración del diálogo de detalles y menú mejorado |

### Funcionalidades Implementadas

1. ✅ **Registro de Egreso con Préstamo**
   - Checkbox "Este gasto fue financiado con dinero prestado"
   - Campo monto cubierto con fondos propios
   - Campo nombre del prestamista
   - Selector tipo de prestamista (Dirigente, Padre, Scout, Externo)
   - Campo fecha límite de devolución (opcional)
   - Cálculo automático del monto prestado
   - Alerta visual mostrando monto del préstamo

2. ✅ **Ver Detalles de Transacción**
   - Monto destacado con color según tipo
   - Grid de información (fecha, categoría, método, proveedor)
   - Sección préstamo asociado (si existe)
   - Galería de evidencias con preview
   - Notas internas

3. ✅ **Editar Transacción**
   - Formulario inline en el mismo diálogo
   - Campos editables: concepto, categoría, monto, fecha, proveedor, método pago, notas
   - Guardado con toast de confirmación
   - Actualización automática del dashboard

### Errores Encontrados y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Falta componente Checkbox | No existía en ui/ | Creado `src/components/ui/checkbox.tsx` |
| Falta @radix-ui/react-checkbox | No instalado | `npm install @radix-ui/react-checkbox` |
| Préstamo no se creaba | SQL requería prestamista_id | Modificado SQL para aceptar prestamista_nombre |
| "column a.codigo does not exist" | Funciones SQL referenciaban columnas inexistentes | Mapeado: `codigo→id::TEXT`, `ubicacion→lugar`, `lugar_detalle→direccion`, `max_participantes→cupo_maximo` |
| Columnas JSONB inexistentes en INSERT | api_crear_actividad insertaba en columnas que no existen | Removidas columnas inexistentes, añadidas columnas reales del schema |
| "column p.dia_numero does not exist" | programas_actividad no tiene dia_numero ni tema_del_dia | Corregido: usar `nombre`, `fecha`, `hora_inicio`, `hora_fin`, `orden` |
| Columnas bloques_programa incorrectas | actividad, materiales, notas, tipo_juego no existen | Corregido: usar `nombre`, `tipo_bloque`, `materiales_necesarios`, `otorga_puntaje`, `puntaje_maximo` |
| puntajes_actividad sin actividad_id | La tabla usa bloque_id, no actividad_id | Corregido: JOIN por bloques→programas→actividad, usar `observaciones` en vez de `motivo` |
| participantes_actividad sin patrulla_id | La tabla no tiene patrulla_id ni notas_medicas | Corregido: usar `restricciones_alimentarias`, `observaciones`, quitar LEFT JOIN patrullas |
| staff_actividad con dirigente_id | La tabla usa persona_id, no dirigente_id | Corregido: JOIN directo a personas |
| presupuesto_actividad con pagado/monto_pagado | La tabla usa monto_ejecutado | Corregido columnas |
| documentos_actividad con tipo_documento | La tabla usa `tipo` y no tiene fecha_vencimiento | Corregido columnas |
| menu_actividad con dia_numero/comida | La tabla usa `dia`, `tipo_comida`, `nombre_plato` | Corregido función api_agregar_menu y query |

---

## 🗺️ Fix: Mapa de Ubicación en Registro Scout v2 (31 Enero 2026)

### Problema Principal
Al editar un scout que tenía ubicación guardada, el mapa no mostraba la ubicación existente.

### Investigación y Diagnóstico

Se descubrieron **múltiples problemas en cadena**:

1. **Frontend - Conversión de tipos**: Los valores de lat/lng no se convertían correctamente a números
2. **Frontend - Sincronización de estado**: El componente `LocationPickerWeb` no sincronizaba cuando recibía nuevos valores
3. **Frontend - Carga de datos incompleta**: Al editar, no se cargaban los datos completos del scout
4. **Frontend - Reset del formulario**: El formulario no se reseteaba cuando cambiaba el scout
5. **Backend - Función incorrecta**: El frontend usaba `api_actualizar_scout`, pero se había actualizado `api_actualizar_scout_completo`
6. **Backend - Campos no incluidos**: `api_actualizar_scout` no incluía los campos de ubicación
7. **Backend - Operador JSON incorrecto**: Se usó el operador `?` que solo funciona con JSONB
8. **Backend - Columna inexistente**: `fecha_registro` no existe en tabla `scouts`
9. **Backend - Error de tipos**: `create_standard_response` requiere casts explícitos `::TEXT`, `::JSON`

### Archivos Modificados

#### Frontend

**[src/components/RegistroScout/components/DatosContacto.tsx](src/components/RegistroScout/components/DatosContacto.tsx)**
```typescript
// Agregado: Conversión explícita a números
const lat = watchedLat != null ? Number(watchedLat) : null;
const lng = watchedLng != null ? Number(watchedLng) : null;
```

**[src/components/RegistroScout/components/LocationPickerWeb.tsx](src/components/RegistroScout/components/LocationPickerWeb.tsx)**
```typescript
// Agregado: useEffect para sincronizar cuando value cambia
useEffect(() => {
  if (value && (value.latitud !== selectedLocation?.latitud || ...)) {
    setSelectedLocation(value);
  }
}, [value?.latitud, value?.longitud, value?.direccion]);

// Mejorado: SafeInvalidateSize con verificación _loaded
const safeInvalidateSize = () => {
  try {
    if (mapInstanceRef.current && 
        mapInstanceRef.current.getContainer() && 
        mapInstanceRef.current._loaded) {
      mapInstanceRef.current.invalidateSize();
    }
  } catch (e) { /* Ignore timing errors */ }
};
```

**[src/components/RegistroScout/v2/RegistroScoutPage.tsx](src/components/RegistroScout/v2/RegistroScoutPage.tsx)**
```typescript
// Cambiado: handleEditScout ahora es async y carga datos completos
const handleEditScout = useCallback(async (scout: Scout) => {
  const fullScout = await ScoutService.getScoutById(scout.id);
  setSelectedScout(fullScout || scout);
  setViewMode("edit");
}, []);
```

**[src/components/RegistroScout/v2/ScoutFormWizard.tsx](src/components/RegistroScout/v2/ScoutFormWizard.tsx)**
```typescript
// Agregado: Reset del formulario cuando cambia el scout
useEffect(() => {
  if (scout) {
    const formData = mapScoutToFormData(scout);
    form.reset(formData);
  }
}, [scout?.id, scout?.ubicacion_latitud, scout?.ubicacion_longitud]);
```

#### Scripts SQL Creados

| Script | Propósito |
|--------|-----------|
| `database/49_fix_dashboard_remove_es_dirigente.sql` | Elimina referencias a `es_dirigente` (columna eliminada), corrige `fecha_registro` → `fecha_ingreso` |
| `database/50_fix_api_obtener_scout_con_ubicacion.sql` | Agrega campos `ubicacion_latitud`, `ubicacion_longitud`, `direccion_completa` al SELECT |
| `database/51_fix_api_actualizar_scout_con_ubicacion.sql` | Actualiza `api_actualizar_scout_completo` (no usada por frontend) |
| `database/52_fix_api_actualizar_scout_ubicacion.sql` | **CRÍTICO**: Actualiza `api_actualizar_scout` con campos de ubicación |

### Errores Encontrados y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Mapa no muestra ubicación al editar | Frontend no sincronizaba selectedLocation | Agregado useEffect en LocationPickerWeb |
| `el._leaflet_pos` undefined | invalidateSize() antes de que Leaflet esté listo | Verificación `map._loaded` + try/catch |
| Ubicación no se guarda | `api_actualizar_scout` no tenía campos de ubicación | Script 52 actualiza la función |
| `operator does not exist: json ? unknown` | Operador `?` solo funciona con JSONB | Cambiado a `p_data->>'campo' IS NOT NULL` |
| `column fecha_registro does not exist` | Columna no existe en tabla scouts | Cambiado a `p.fecha_ingreso` de tabla personas |
| `es_dirigente does not exist` | Columna eliminada de scouts | Usar tabla `dirigentes` con EXISTS |
| `create_standard_response` type mismatch | Función requiere tipos explícitos | Agregados casts `::TEXT`, `::JSON` |
| Función duplicada | Múltiples firmas de `api_actualizar_scout` | DROP de todas las firmas antes de CREATE |

### Orden de Ejecución de Scripts

```bash
# 1. Dashboard y estadísticas
database/49_fix_dashboard_remove_es_dirigente.sql

# 2. Consultar scout con ubicación
database/50_fix_api_obtener_scout_con_ubicacion.sql

# 3. Actualizar scout con ubicación (LA QUE USA EL FRONTEND)
database/52_fix_api_actualizar_scout_ubicacion.sql
```

### Verificación

```sql
-- Verificar que hay scouts con ubicación guardada
SELECT p.nombres, p.apellidos, p.ubicacion_latitud, p.ubicacion_longitud
FROM personas p
JOIN scouts s ON s.persona_id = p.id
WHERE p.ubicacion_latitud IS NOT NULL
LIMIT 5;
```

### Lecciones Aprendidas

1. **Verificar qué función usa el frontend**: El servicio usaba `api_actualizar_scout`, no `api_actualizar_scout_completo`
2. **JSON vs JSONB**: El operador `?` solo funciona con JSONB
3. **Leaflet timing**: Siempre verificar `map._loaded` antes de `invalidateSize()`
4. **Carga completa de datos**: Al editar, cargar datos frescos del backend con `getScoutById()`
5. **React Hook Form**: Usar `form.reset()` cuando cambia la entidad que se edita

---

## 👨‍👩‍👧‍👦 Fix: Soporte para N Familiares en Registro Scout (31 Enero 2026)

### Problema Principal
El sistema solo soportaba 1 familiar por scout (campos `familiar_*` en tabla `personas`). Se necesitaba soportar **N familiares** usando la tabla `familiares_scout`.

### Síntomas Encontrados
1. Solo se guardaba 1 familiar aunque se agregaran más en el formulario
2. Al editar un scout con 2 familiares, solo se mostraba 1 en la UI
3. Los familiares no se actualizaban correctamente al guardar

### Investigación y Diagnóstico

Se descubrieron **múltiples problemas en cadena**:

| Capa | Problema | Causa |
|------|----------|-------|
| SQL | Solo guardaba 1 familiar | `api_actualizar_scout` solo actualizaba campos `familiar_*` en personas |
| SQL | No leía familiares | `api_obtener_scout` no consultaba tabla `familiares_scout` |
| Frontend | `getFamiliaresByScout` retornaba vacío | Accedía a `data.familiares` en vez de `data.data.familiares` (response wrapper) |
| Frontend | UI mostraba 1 de 2 familiares | `useFieldArray` de React Hook Form no se actualizaba correctamente |

### Solución Implementada

#### 1. SQL - CRUD Completo de Familiares

**Script:** `database/53_add_familiar_fields.sql`

**`api_obtener_scout`** - Ahora retorna array `familiares`:
```sql
-- Obtener TODOS los familiares de la tabla familiares_scout
SELECT COALESCE(json_agg(
    json_build_object(
        'id', fs.id,
        'nombres', pf.nombres,
        'apellidos', pf.apellidos,
        'parentesco', fs.parentesco,
        'celular', pf.celular,
        'correo', pf.correo,
        'es_contacto_emergencia', fs.es_contacto_emergencia,
        'es_apoderado', fs.es_autorizado_recoger
    ) ORDER BY fs.created_at ASC
), '[]'::json) INTO v_familiares
FROM familiares_scout fs
JOIN personas pf ON fs.persona_id = pf.id
WHERE fs.scout_id = p_scout_id;

-- Agregar al resultado
v_result := v_result::jsonb || jsonb_build_object('familiares', v_familiares);
```

**`api_actualizar_scout`** - CRUD completo para familiares:
```sql
-- Procesar array de familiares enviado
FOR v_familiar_item IN SELECT * FROM json_array_elements(p_data->'familiares')
LOOP
    -- Si tiene UUID válido → UPDATE existente
    -- Si no tiene UUID → INSERT nuevo
    -- IDs no recibidos → DELETE
END LOOP;
```

#### 2. Frontend - Extracción Correcta de Datos

**Archivo:** `src/services/scoutService.ts`

```typescript
static async getFamiliaresByScout(scoutId: string): Promise<any[]> {
  const { data } = await supabase.rpc('api_obtener_scout', { p_scout_id: scoutId });
  
  // Response viene envuelto en create_standard_response
  // Estructura: { success, message, data: { ...scout, familiares: [...] } }
  const scoutData = data?.data || data;
  const familiares = scoutData?.familiares || [];
  
  return familiares;
}
```

#### 3. Frontend - Fix de useFieldArray

**Archivo:** `src/components/RegistroScout/v2/ScoutFormWizard.tsx`

```typescript
// Problema: useFieldArray no detectaba cambios con form.setValue()
// Solución: Forzar re-render con spread operator + setTimeout

form.setValue('familiares', familiaresMapped, { 
  shouldValidate: false,
  shouldDirty: false,
  shouldTouch: false 
});

// Forzar re-render después de un tick
setTimeout(() => {
  form.setValue('familiares', [...familiaresMapped]);
}, 100);
```

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `database/53_add_familiar_fields.sql` | CRUD completo: `api_obtener_scout` retorna array, `api_actualizar_scout` maneja INSERT/UPDATE/DELETE |
| `src/services/scoutService.ts` | `getFamiliaresByScout` accede a `data.data.familiares`, `updateScout` envía array `familiares` |
| `src/components/RegistroScout/v2/ScoutFormWizard.tsx` | Logs de debug + setTimeout para forzar re-render de useFieldArray |

### Flujo de Datos Final

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CREAR SCOUT                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend                                                             │
│   ScoutFormWizard.onSubmit()                                        │
│     ↓ { ...scoutData, familiares: [...] }                          │
│   ScoutService.createScout()                                        │
│     ↓ RPC api_registrar_scout_completo                              │
│ Backend                                                              │
│   1. INSERT INTO personas (scout)                                   │
│   2. INSERT INTO scouts                                             │
│   3. FOR cada familiar:                                             │
│      - INSERT INTO personas (familiar)                              │
│      - INSERT INTO familiares_scout                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        EDITAR SCOUT                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend (Cargar)                                                    │
│   ScoutService.getScoutById()                                       │
│     ↓ RPC api_obtener_scout → { ...scout, familiares: [...] }      │
│   ScoutFormWizard.cargarFamiliaresScout()                          │
│     ↓ form.setValue('familiares', familiaresMapped)                │
│     ↓ setTimeout → form.setValue([...familiaresMapped])  ← FIX!    │
│   DatosFamiliares.tsx                                               │
│     ↓ useFieldArray({ name: 'familiares' })                        │
│     ↓ fields.map() → Renderiza N tarjetas                          │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend (Guardar)                                                   │
│   ScoutFormWizard.onSubmit()                                        │
│     ↓ { ...scoutData, familiares: [...] }                          │
│   ScoutService.updateScout()                                        │
│     ↓ RPC api_actualizar_scout                                      │
│ Backend                                                              │
│   1. UPDATE personas SET ... (datos scout)                          │
│   2. UPDATE scouts SET ... (rama, estado, etc)                      │
│   3. FOR cada familiar recibido:                                    │
│      - Si tiene UUID válido y existe → UPDATE                       │
│      - Si no tiene UUID → INSERT nuevo                              │
│   4. FOR cada familiar existente no recibido:                       │
│      - DELETE FROM familiares_scout                                 │
│      - DELETE FROM personas (si no tiene otros vínculos)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Lecciones Aprendidas

1. **React Hook Form + useFieldArray**: El `setValue()` no siempre dispara re-render. Usar spread operator `[...array]` + `setTimeout` para forzarlo.

2. **Response Wrapper**: Las funciones SQL usan `create_standard_response()` que envuelve los datos en `{ success, message, data }`. Hay que acceder a `response.data.data` para los datos reales.

3. **CRUD de Arrays en SQL**: Para manejar arrays (familiares) en PostgreSQL:
   - Guardar IDs existentes antes de procesar
   - Comparar IDs recibidos vs existentes
   - UPDATE los que coinciden, INSERT los nuevos, DELETE los que faltan

4. **Compatibilidad Legacy**: Mantener campos `familiar_*` en tabla `personas` para compatibilidad con código antiguo, mientras se usa `familiares_scout` para N familiares.

5. **⚠️ Patrulla en Tabla Separada (miembros_patrulla)**: 
   - La patrulla del scout **NO se guarda** en las tablas `personas` ni `scouts`
   - Se guarda en la tabla `miembros_patrulla` como una **relación separada**
   - `ScoutService.updateScout()` actualiza `personas` y `scouts`, pero **NO toca `miembros_patrulla`**
   - Para guardar la patrulla después de editar un scout, se debe hacer manualmente:
     ```typescript
     // 1. Marcar membresía anterior como inactiva
     await supabase
       .from('miembros_patrulla')
       .update({ fecha_salida: new Date().toISOString().split('T')[0], estado_miembro: 'INACTIVO' })
       .eq('scout_id', scout.id)
       .is('fecha_salida', null);
     
     // 2. Crear nueva membresía
     await supabase
       .from('miembros_patrulla')
       .insert({
         scout_id: scout.id,
         patrulla_id: data.patrulla_id,
         cargo_patrulla: data.cargo_patrulla || 'MIEMBRO',
         fecha_ingreso: new Date().toISOString().split('T')[0],
         estado_miembro: 'ACTIVO'
       });
     ```
   - **Columnas de miembros_patrulla**: `id`, `scout_id`, `patrulla_id`, `cargo_patrulla`, `fecha_ingreso`, `fecha_salida`, `estado_miembro`
   - **Valores de cargo_patrulla**: `'GUIA'`, `'SUBGUIA'`, `'TESORERO'`, `'SECRETARIO'`, `'MIEMBRO'`

---

## � Implementación de Permisos RBAC en Componentes

### Resumen de la Solución

El sistema implementa **Role-Based Access Control (RBAC)** verificando permisos antes de cada operación CRUD. Cada componente importa el hook `usePermissions` y valida los permisos correspondientes antes de permitir acciones.

### Patrón de Implementación

```tsx
// 1. Importar hook de permisos
import { usePermissions } from '../../contexts/PermissionsContext';

// 2. Usar hook en el componente
const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();

// 3. Verificar en handlers antes de ejecutar
const handleCreateItem = async () => {
  if (!puedeCrear('modulo_nombre')) {
    alert('No tienes permiso para crear registros');
    return;
  }
  // ... lógica de creación
};

// 4. Ocultar botones condicionalmente
{puedeEditar('modulo_nombre') && (
  <button onClick={handleEdit}>✏️ Editar</button>
)}

{puedeEliminar('modulo_nombre') && (
  <button onClick={handleDelete}>🗑️ Eliminar</button>
)}
```

### Módulos con Permisos Implementados

#### **Scouts**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ListaScouts.tsx` | `puedeEditar`, `puedeEliminar` | Oculta botones de edición/eliminación |
| `EditarScoutModal.tsx` | `puedeEditar` | Valida antes de guardar cambios |
| `ScoutFormWizard.tsx` | `puedeCrear`, `puedeEditar` | Valida en onSubmit según modo |

#### **Dirigentes**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `DirigentesV2.tsx` | `puedeCrear`, `puedeEditar` | Valida en nuevo/editar dirigente |

#### **Finanzas**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `FinanzasDashboard.tsx` | `puedeCrear` | Oculta botones de nueva transacción |
| `TransaccionesTab.tsx` | `puedeEditar`, `puedeEliminar` | Oculta items del dropdown |
| `PrestamosTab.tsx` | `puedeEditar`, `puedeEliminar` | Valida pagos y cancelaciones |

#### **Patrullas**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `Patrullas.tsx` | `puedeCrear`, `puedeEditar`, `puedeEliminar` | CRUD completo protegido |

#### **Inventario**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `Inventario.tsx` | `puedeCrear`, `puedeEditar`, `puedeEliminar` | CRUD completo protegido |

#### **Asistencia**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `Asistencia.tsx` | `puedeCrear`, `puedeEditar`, `puedeEliminar` | Gestión de reuniones protegida |

#### **Actividades Scout**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ActividadesScoutMigrated.tsx` | `puedeCrear`, `puedeEditar`, `puedeEliminar` | CRUD de actividades protegido |

#### **Actividades Exterior**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ActividadesExteriorDashboard.tsx` | `puedeCrear` | Botón "Nueva Actividad" |
| `ActividadDetalle.tsx` | `puedeCrear`, `puedeEditar`, `puedeEliminar` | Programa, presupuesto, menú, compras, participantes, puntajes |

#### **Progresión**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ScoutProgresionDetail.tsx` | `puedeEditar` | Toggle objetivos y asignar etapa |

#### **Comité de Padres**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ComitePadresMigrated.tsx` | `puedeCrear`, `puedeEliminar` | Registrar y remover miembros |

#### **Libro de Oro**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `LibroOroMigrated.tsx` | `puedeCrear` | Crear nuevas entradas |

#### **Programa Semanal**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `ProgramaSemanalMigrated.tsx` | `puedeCrear` | Guardar programas |

#### **Documentos/Reportes**
| Archivo | Permisos | Descripción |
|---------|----------|-------------|
| `TemplateManager.tsx` | `puedeCrear`, `puedeEliminar` | Gestión de plantillas |

### Nombres de Módulos para Permisos

| Módulo | Nombre para `usePermissions()` |
|--------|-------------------------------|
| Scouts | `'scouts'` |
| Dirigentes | `'dirigentes'` |
| Finanzas | `'finanzas'` |
| Patrullas | `'patrullas'` |
| Inventario | `'inventario'` |
| Asistencia | `'asistencia'` |
| Actividades Scout | `'actividades'` |
| Actividades Exterior | `'actividades_exterior'` |
| Progresión | `'progresion'` |
| Comité de Padres | `'comite_padres'` |
| Libro de Oro | `'libro_oro'` |
| Programa Semanal | `'programa_semanal'` |
| Reportes | `'reportes'` |

### Cómo Agregar Permisos a un Nuevo Componente

1. **Importar el hook:**
   ```tsx
   import { usePermissions } from '../../contexts/PermissionsContext';
   ```

2. **Usar en el componente:**
   ```tsx
   const { puedeCrear, puedeEditar, puedeEliminar, puedeExportar } = usePermissions();
   ```

3. **Validar en handlers:**
   ```tsx
   const handleNuevoRegistro = () => {
     if (!puedeCrear('mi_modulo')) {
       alert('No tienes permiso para crear registros');
       return;
     }
     // Continuar con la lógica
   };
   ```

4. **Ocultar elementos UI:**
   ```tsx
   {puedeCrear('mi_modulo') && (
     <Button onClick={handleNuevoRegistro}>
       <Plus /> Nuevo
     </Button>
   )}
   ```

### Roles y Niveles de Acceso

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `super_admin` | 100 | Acceso total a todo el sistema |
| `jefe_grupo` | 90 | Administrador del grupo scout |
| `coordinador` | 70 | Coordinador de rama/área |
| `dirigente` | 50 | Dirigente activo |
| `asistente` | 30 | Asistente de dirigente |
| `padre_familia` | 20 | Padre de familia de scout |
| `scout` | 10 | Scout (acceso limitado) |

### Verificación de Permisos en Base de Datos

La función `tiene_permiso()` en PostgreSQL verifica:

```sql
SELECT tiene_permiso(
  'user-uuid',      -- ID del usuario
  'scouts',         -- Módulo
  'editar'          -- Acción: leer, crear, editar, eliminar, exportar
);
```

---

## �🔮 Mejoras Futuras - Permisos Granulares

### Separación de Permisos de Visualización

Actualmente el sistema maneja permisos a nivel de módulo con acciones (leer, crear, editar, eliminar, exportar). Para el futuro se puede implementar mayor granularidad:

#### Nivel 1: Separar "Ver módulo" de "Ver detalle"

| Permiso | Descripción | Ejemplo |
|---------|-------------|---------|
| `leer` | Acceder a la sección/módulo | Ver la lista de scouts |
| `ver_detalle` | Ver información de un registro específico | Ver ficha completa de un scout |

**Caso de uso:**
- Un padre de familia podría ver el módulo "Scouts" pero solo los detalles de **SU hijo**
- Un coordinador de Tropa vería solo scouts de **su rama**

#### Nivel 2: Row Level Security (RLS) Avanzado

Implementar políticas de seguridad a nivel de fila para control granular:

```sql
-- Ejemplo: Padre solo ve sus hijos
CREATE POLICY padre_ve_sus_hijos ON scouts
FOR SELECT
USING (
  auth.uid() IN (
    SELECT familiar_id FROM scout_familiares 
    WHERE scout_id = scouts.id
  )
);

-- Ejemplo: Coordinador ve scouts de su rama
CREATE POLICY coordinador_ve_su_rama ON scouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuario_ramas ur
    WHERE ur.user_id = auth.uid()
    AND ur.rama = scouts.rama_actual
  )
);
```

#### Nivel 3: Permisos por Rama

| Rol | Dashboard | Scouts | Finanzas | Reportes |
|-----|-----------|--------|----------|----------|
| Jefe de Grupo | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo |
| Coordinador Tropa | ✅ | Solo Tropa | Solo Tropa | Solo Tropa |
| Dirigente Manada | ✅ | Solo Manada | ❌ | Solo Manada |
| Padre de Familia | ❌ | Solo su hijo | ❌ | ❌ |

#### Implementación Propuesta

**1. Nueva tabla `usuario_ramas`:**
```sql
CREATE TABLE usuario_ramas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  rama VARCHAR(20) NOT NULL,
  es_coordinador BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. Modificar función `tiene_permiso`:**
```sql
CREATE OR REPLACE FUNCTION tiene_permiso_granular(
  p_user_id UUID,
  p_modulo VARCHAR(50),
  p_accion VARCHAR(20),
  p_rama VARCHAR(20) DEFAULT NULL,
  p_registro_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar permiso base
  IF NOT tiene_permiso(p_user_id, p_modulo, p_accion) THEN
    RETURN FALSE;
  END IF;
  
  -- Si es super_admin o jefe_grupo, acceso total
  IF es_admin_global(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar acceso por rama
  IF p_rama IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM usuario_ramas 
      WHERE user_id = p_user_id AND rama = p_rama
    );
  END IF;
  
  -- Verificar acceso por registro (para padres)
  IF p_registro_id IS NOT NULL THEN
    RETURN es_familiar_de_scout(p_user_id, p_registro_id);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**3. Actualizar contexto en frontend:**
```typescript
interface PermissionsContextType {
  // Existentes
  puedeAcceder: (modulo: Modulo) => boolean;
  puedeCrear: (modulo: Modulo) => boolean;
  // Nuevos
  puedeVerDetalle: (modulo: Modulo, registroId?: string) => boolean;
  puedeAccederRama: (modulo: Modulo, rama: string) => boolean;
  ramasAsignadas: string[];
}
```

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `database/permisos_granulares.sql` | Crear tablas y funciones |
| `src/services/permissionsService.ts` | Agregar métodos granulares |
| `src/contexts/PermissionsContext.tsx` | Exponer nuevos checks |
| `src/components/Scouts/ScoutsList.tsx` | Filtrar por rama/registro |

### Prioridad de Implementación

1. 🟡 **Media** - Separar `leer` de `ver_detalle` (2-3 horas)
2. 🟠 **Alta complejidad** - RLS por rama (4-6 horas)
3. 🔴 **Alta complejidad** - RLS por registro/familiar (6-8 horas)

> **Nota:** El sistema actual es "todo o nada" por módulo. Implementar estas mejoras cuando haya casos de uso concretos que lo requieran.

---