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