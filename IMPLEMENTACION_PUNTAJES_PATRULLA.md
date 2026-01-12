# 🏆 Implementación del Sistema de Puntajes por Patrulla
## Módulo de Programa Semanal

**Fecha:** 9 de enero de 2026  
**Sistema:** Gestión Scout - Grupo Scout Lima 12

---

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de puntajes por patrulla para las actividades del programa semanal, permitiendo:

✅ Registrar puntajes por patrulla en cada actividad  
✅ Gestión masiva de puntajes (todas las patrullas a la vez)  
✅ Vista de ranking con podio visual (1°, 2°, 3° lugar)  
✅ Totales acumulados por programa  
✅ Integración con el módulo de Patrullas  

---

## 📁 Archivos Creados/Modificados

### 1. Base de Datos
- **`database/add_programa_puntajes_patrulla.sql`**
  - Tabla `programa_actividad_puntajes`
  - Vistas `vista_puntajes_programa_completo` y `vista_totales_patrulla_programa`
  - Funciones SQL: 
    - `api_registrar_puntaje_actividad`
    - `api_registrar_puntajes_masivo`
    - `api_obtener_puntajes_actividad`
    - `api_obtener_totales_programa`

### 2. Frontend - Services
- **`src/services/programaSemanalService.ts`** (modificado)
  - `registrarPuntaje()` - Registrar puntaje individual
  - `registrarPuntajesMasivo()` - Registrar múltiples puntajes
  - `obtenerPuntajesActividad()` - Obtener puntajes de una actividad
  - `obtenerTotalesPrograma()` - Obtener totales por patrulla
  - `obtenerPatrullasActivas()` - Listar patrullas de una rama

### 3. Frontend - Componentes
- **`src/components/ProgramaSemanal/PuntajesActividad.tsx`** (nuevo)
  - Modal para asignar puntajes a patrullas
  - Tabla con input de puntaje y observaciones
  - Cálculo de totales en vivo
  
- **`src/components/ProgramaSemanal/RankingPatrullas.tsx`** (nuevo)
  - Modal con ranking visual
  - Podio animado (1°, 2°, 3° lugar)
  - Tabla completa con estadísticas
  - Métricas de participación
  
- **`src/components/ProgramaSemanal/ProgramaSemanal.tsx`** (modificado)
  - Botón "Puntajes" en cada actividad
  - Botón "Ver Ranking" en vista de programa
  - Integración con modales de puntajes y ranking

---

## 🚀 Pasos de Instalación

### 1. Ejecutar Script SQL

```bash
# Conectar a la base de datos
psql -U postgres -h <host> -p 6543 -d postgres -f database/add_programa_puntajes_patrulla.sql
```

**O desde Supabase SQL Editor:**
1. Ir a SQL Editor en el dashboard de Supabase
2. Copiar el contenido de `database/add_programa_puntajes_patrulla.sql`
3. Ejecutar el script completo

### 2. Verificar Tablas Creadas

```sql
-- Verificar tabla de puntajes
SELECT * FROM information_schema.columns 
WHERE table_name = 'programa_actividad_puntajes';

-- Verificar vistas
SELECT * FROM vista_totales_patrulla_programa LIMIT 5;

-- Verificar funciones
SELECT proname FROM pg_proc 
WHERE proname LIKE 'api_%puntaje%';
```

### 3. Reiniciar Servidor Frontend

```bash
# Detener proceso actual
pkill -f vite

# Iniciar servidor
npm run dev
```

---

## 🎯 Cómo Usar el Sistema

### 1. Crear un Programa Semanal
1. Ir a **Módulo Programa**
2. Crear nuevo programa con actividades
3. Asegurarse de que el programa tenga una rama asignada (MANADA, TROPA, COMUNIDAD, CLAN)

### 2. Asignar Puntajes a Actividades
1. Abrir detalles del programa (botón 👁️ Ver)
2. En cada actividad, hacer clic en **"Puntajes"**
3. Se abrirá modal con todas las patrullas activas de esa rama
4. Ingresar puntaje (0-100) y observaciones opcionales
5. Guardar

### 3. Ver Ranking de Patrullas
1. En la vista de detalles del programa
2. Hacer clic en **"Ver Ranking"** (botón amarillo superior)
3. Se muestra:
   - **Podio visual** con top 3
   - **Tabla completa** con todas las patrullas
   - **Estadísticas** de participación

---

## 📊 Estructura de Datos

### Tabla: `programa_actividad_puntajes`

```sql
CREATE TABLE programa_actividad_puntajes (
    id UUID PRIMARY KEY,
    actividad_id UUID REFERENCES programa_actividades(id),
    patrulla_id UUID REFERENCES patrullas(id),
    puntaje INTEGER DEFAULT 0,
    observaciones TEXT,
    registrado_por VARCHAR(255),
    fecha_registro TIMESTAMP,
    UNIQUE(actividad_id, patrulla_id)  -- Una patrulla = un puntaje por actividad
);
```

### Vista: `vista_totales_patrulla_programa`

Suma automática de puntajes por patrulla para cada programa:

```sql
SELECT 
    programa_id,
    patrulla_nombre,
    SUM(puntaje) AS total_puntaje,
    COUNT(*) AS actividades_participadas
FROM programa_actividad_puntajes
GROUP BY programa_id, patrulla_id;
```

---

## 🎨 Características de UX Implementadas

### ✅ Modal de Puntajes
- **Tabla clara** con fila por patrulla
- **Inputs numéricos** con validación (0-100)
- **Campo de observaciones** opcionales
- **Color identificador** por patrulla
- **Total general** calculado en vivo
- **Guardado masivo** de todos los puntajes

### ✅ Ranking Visual
- **Podio animado** estilo medallero olímpico
  - 🥇 1° Lugar: Dorado, altura máxima
  - 🥈 2° Lugar: Plateado, altura media
  - 🥉 3° Lugar: Bronce, altura baja
- **Tabla completa** con todas las posiciones
- **Métricas adicionales:**
  - Actividades participadas
  - Promedio de puntaje
- **Estadísticas globales:**
  - Puntos totales del programa
  - Patrullas participantes
  - Actividades evaluadas

---

## 🔧 Funciones SQL Principales

### 1. Registrar Puntaje Individual

```sql
SELECT api_registrar_puntaje_actividad(
    p_actividad_id := '<uuid-actividad>',
    p_patrulla_id := '<uuid-patrulla>',
    p_puntaje := 85,
    p_observaciones := 'Excelente desempeño',
    p_registrado_por := 'Juan Pérez'
);
```

### 2. Registrar Puntajes Masivos

```sql
SELECT api_registrar_puntajes_masivo(
    p_actividad_id := '<uuid-actividad>',
    p_puntajes := '[
        {"patrulla_id": "<uuid1>", "puntaje": 90},
        {"patrulla_id": "<uuid2>", "puntaje": 85}
    ]'::JSONB,
    p_registrado_por := 'Sistema'
);
```

### 3. Obtener Totales

```sql
SELECT api_obtener_totales_programa(
    p_programa_id := '<uuid-programa>'
);
```

---

## 🐛 Troubleshooting

### Error: "Patrulla no encontrada"
**Causa:** No existen patrullas activas en la rama del programa  
**Solución:** Crear patrullas en el módulo de Patrullas con `estado = 'ACTIVO'`

### Error: "Actividad no encontrada"
**Causa:** El ID de actividad no existe en `programa_actividades`  
**Solución:** Verificar que el programa tenga actividades creadas correctamente

### No se muestran patrullas en el modal
**Causa:** Las patrullas no están en la misma rama que el programa  
**Solución:** Asegurarse de que `patrullas.rama = programa_semanal.rama`

### Botón "Puntajes" no aparece
**Causa:** La actividad no tiene un `id` asignado (datos demo)  
**Solución:** Crear un programa real desde el formulario, no usar datos demo

---

## 📈 Próximas Mejoras Sugeridas

- [ ] Gráficas de evolución de puntajes por fecha
- [ ] Exportar ranking a PDF/Excel
- [ ] Historial de puntajes por periodo
- [ ] Sistema de insignias/logros por puntajes acumulados
- [ ] Notificaciones cuando una patrulla sube de posición
- [ ] Comparación entre programas diferentes
- [ ] Filtros por rango de fechas en el ranking

---

## 📞 Soporte

Para dudas o problemas con la implementación, revisar:
- **Logs de Supabase:** SQL Editor > Logs
- **Console del navegador:** F12 > Console
- **Terminal del servidor:** Ver output de `npm run dev`

---

**✅ Implementación Completa y Lista para Uso**  
Sistema de puntajes por patrulla totalmente funcional siguiendo las políticas de UX/UI del proyecto.
