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
---