# Implementación: Sub Campos y Patrullas por Actividad

## 📋 Resumen

Esta implementación agrega dos funcionalidades al módulo de Actividades al Aire Libre:

1. **Patrullas por Actividad**: Patrullas específicas para cada actividad (independientes de las patrullas del sistema), útiles para campamentos con scouts externos
2. **Sub Campos**: Agrupaciones opcionales dentro de un programa que organizan patrullas y tienen un responsable

---

## 🗄️ Modelo de Datos

### Nuevas Tablas

```
patrullas_actividad
├── id (UUID, PK)
├── actividad_id (FK → actividades_exterior)
├── nombre (VARCHAR 100)
├── color (VARCHAR 7) - Código hexadecimal
├── icono (VARCHAR 10) - Emoji
├── orden (INTEGER)
└── created_at, updated_at

subcampos_programa
├── id (UUID, PK)
├── programa_id (FK → programas_actividad)
├── nombre (VARCHAR 100)
├── responsable_id (FK → scouts, opcional)
├── orden (INTEGER)
└── created_at, updated_at

subcampo_patrullas (Tabla pivote)
├── subcampo_id (FK → subcampos_programa)
├── patrulla_id (FK → patrullas_actividad)
├── PK: (subcampo_id, patrulla_id)
└── created_at
```

### Columnas Nuevas

| Tabla | Columna | Tipo | Descripción |
|-------|---------|------|-------------|
| `participantes_actividad` | `patrulla_actividad_id` | UUID | Patrulla asignada al participante |
| `puntajes_actividad` | `patrulla_actividad_id` | UUID | Puntaje asignado a patrulla |
| `puntajes_actividad` | `subcampo_id` | UUID | Sub campo del puntaje (opcional) |

---

## 🔧 Funciones SQL Creadas

### Patrullas
| Función | Descripción |
|---------|-------------|
| `api_listar_patrullas_actividad(p_actividad_id)` | Lista patrullas con cantidad de participantes |
| `api_crear_patrulla_actividad(p_actividad_id, p_nombre, p_color, p_icono)` | Crea nueva patrulla |
| `api_actualizar_patrulla_actividad(p_patrulla_id, p_nombre, p_color, p_icono, p_orden)` | Actualiza patrulla |
| `api_eliminar_patrulla_actividad(p_patrulla_id)` | Elimina patrulla |
| `api_importar_patrullas_sistema(p_actividad_id)` | Importa patrullas del sistema |
| `api_asignar_participante_patrulla(p_participante_id, p_patrulla_id)` | Asigna participante a patrulla |
| `api_ranking_patrullas_actividad(p_actividad_id, p_subcampo_id)` | Ranking por puntaje |

### Sub Campos
| Función | Descripción |
|---------|-------------|
| `api_listar_subcampos(p_programa_id)` | Lista subcampos con sus patrullas |
| `api_crear_subcampo(p_programa_id, p_nombre, p_responsable_id, p_patrullas_ids)` | Crea subcampo |
| `api_actualizar_subcampo(p_subcampo_id, p_nombre, p_responsable_id, p_patrullas_ids)` | Actualiza subcampo |
| `api_eliminar_subcampo(p_subcampo_id)` | Elimina subcampo |

### Funciones Actualizadas
- `api_obtener_actividad` ahora incluye:
  - `patrullas_actividad[]` en el objeto principal
  - `subcampos[]` anidados dentro de cada programa
  - `patrulla_actividad_id`, `patrulla_nombre`, `patrulla_color` en participantes

---

## 📁 Archivos Creados/Modificados

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `database/73_subcampos_patrullas_actividad.sql` | Migración SQL completa |
| `src/components/ActividadesExterior/components/PatrullasTab.tsx` | UI para gestionar patrullas |

### Modificados
| Archivo | Cambios |
|---------|---------|
| `src/services/actividadesExteriorService.ts` | Nuevas interfaces y métodos |
| `src/components/ActividadesExterior/ActividadDetalle.tsx` | Nueva pestaña "Patrullas" |

---

## 🚀 Instrucciones de Instalación

### Paso 1: Ejecutar Migración SQL

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar el contenido completo de `database/73_subcampos_patrullas_actividad.sql`
3. Ejecutar (Ctrl+Enter / Cmd+Enter)
4. Verificar el mensaje de éxito al final:
   ```
   ✅ Script ejecutado correctamente
   ```

### Paso 2: Reiniciar Frontend (si es necesario)

```bash
cd /path/to/laUniversidadDelEscultismo
pkill -f vite && npm run dev
```

### Paso 3: Verificar Instalación

1. Abrir una actividad existente
2. Ver que aparece la nueva pestaña **🏕️ Patrullas**
3. Probar crear una patrulla nueva
4. Probar importar patrullas del sistema

---

## 🎨 UI/UX Implementado

### Pestaña Patrullas

- **Estado Vacío**: Ilustración + CTA para crear o importar
- **Lista de Patrullas**: Cards con:
  - Barra de color identificativa
  - Icono/emoji
  - Nombre
  - Cantidad de participantes
  - Puntaje (si hay ranking)
  - Menú de acciones (editar/eliminar)
- **Ranking Global**: Vista de clasificación por puntos

### Diálogo Crear/Editar

- Selector de nombre
- Paleta de colores predefinida
- Selector de iconos (emojis)
- Vista previa en tiempo real

---

## 📊 Flujos de Uso

### Flujo 1: Actividad con Scouts del Sistema

1. Crear actividad
2. Ir a pestaña Patrullas → **"Importar del Sistema"**
3. Las patrullas existentes (Halcones, Tigres, etc.) se copian
4. Los participantes ya vienen con su patrulla asignada

### Flujo 2: Campamento con Scouts Externos

1. Crear actividad
2. Ir a pestaña Patrullas → **"Nueva Patrulla"**
3. Crear patrullas específicas (Equipo A, Equipo B, etc.)
4. En Participantes, asignar cada persona a su patrulla

### Flujo 3: Sub Campos (Opcional)

1. Crear programa tipo "JORNADA" o "COMPETENCIA"
2. Crear Sub Campo (ej: "Campo Norte")
3. Asignar patrullas que pertenecen a ese sub campo
4. Asignar responsable (dirigente)
5. Los puntajes pueden filtrarse por sub campo

---

## 🔮 Próximos Pasos (Opcionales)

1. **UI de Sub Campos**: Componente visual para gestionar sub campos dentro de cada programa
2. **Asignación en Participantes**: Dropdown para asignar patrulla en la tabla de participantes
3. **Filtro en Puntajes**: Filtrar puntajes por sub campo
4. **Reportes**: Exportar ranking por sub campo

---

## 📝 Notas Técnicas

- Las patrullas de actividad son **independientes** de las patrullas del sistema (`patrullas`)
- La función `api_importar_patrullas_sistema` copia datos, no crea referencias
- Los sub campos son **opcionales** - los programas funcionan sin ellos
- El ranking calcula automáticamente la suma de puntajes por patrulla
- Los participantes sin patrulla asignada quedan con `patrulla_actividad_id = NULL`

---

*Implementado: Enero 2026*
