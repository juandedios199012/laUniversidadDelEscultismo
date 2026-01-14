# 📱 Arquitectura del Aplicativo Móvil Scout
## Sistema de Gestión Scout - Grupo Scout Lima 12

**Fecha:** 12 de enero de 2026  
**Objetivo:** Aplicativo iOS/Android para gestión offline de Puntajes, Asistencia y Scouts

---

## 🎯 Funcionalidades Móviles

### 1. **Puntajes de Patrulla**
- ✅ Ver programa semanal del día/semana actual
- ✅ Ver actividades planificadas con competencias asociadas
- ✅ Otorgar puntajes a patrullas en tiempo real
- ✅ Historial de puntajes de la sesión
- ✅ Sincronización al tener conexión

### 2. **Asistencia**
- ✅ Lista de scouts por rama/patrulla
- ✅ Marcar presente/ausente/tardanza/justificado
- ✅ Registro rápido (un tap por scout)
- ✅ Trabajar offline y sincronizar después

### 3. **Lista de Scouts**
- ✅ Ver información básica (foto, nombre, código, rama)
- ✅ Búsqueda rápida
- ✅ Filtros por rama/patrulla/estado
- ✅ Solo lectura (sin edición)

---

## 🏗️ Stack Tecnológico Recomendado

### **Opción A: React Native (RECOMENDADA)**
**Ventajas:**
- ✅ Comparte código con la web actual (React + TypeScript)
- ✅ Un solo equipo de desarrollo
- ✅ 90% código compartido entre iOS/Android
- ✅ Performance nativo con Expo
- ✅ Acceso a APIs nativas (cámara, geolocalización, notificaciones)

**Stack:**
```
React Native 0.73+
TypeScript
Expo SDK 50+
React Navigation
Zustand (state management)
WatermelonDB (base de datos local offline)
Supabase JS Client
```

### **Opción B: Flutter**
**Ventajas:**
- ✅ Excelente performance
- ✅ UI consistente y hermosa
- ⚠️ Requiere aprender Dart
- ⚠️ Equipo separado del frontend web

### **Opción C: PWA (Progressive Web App)**
**Ventajas:**
- ✅ Reutiliza 100% el código actual
- ✅ Sin tiendas de apps
- ✅ Actualizaciones instantáneas
- ⚠️ Limitaciones en APIs nativas
- ⚠️ Menor performance que nativo

**🎯 Recomendación:** **React Native con Expo** por balance entre esfuerzo, performance y mantenibilidad.

---

## 📊 Arquitectura de Datos

### **Estrategia Offline-First**

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ├──> Local DB (WatermelonDB)
         │    ├── Cache de scouts
         │    ├── Cache de programas
         │    ├── Cola de sincronización
         │    └── Puntajes/Asistencias pendientes
         │
         └──> API (Supabase REST/Realtime)
              ├── Sincronización bidireccional
              ├── Resolución de conflictos
              └── Webhooks para notificaciones
```

### **Tablas Adicionales (Backend)**

#### 1. **mobile_sync_queue** (Cola de Sincronización)
```sql
CREATE TABLE mobile_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    device_id VARCHAR(255) NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(100) NOT NULL,    -- 'puntajes_patrulla', 'asistencias'
    record_id UUID,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'conflict', 'failed'
    conflict_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    attempts INT DEFAULT 0
);

CREATE INDEX idx_sync_queue_user_status ON mobile_sync_queue(user_id, status);
CREATE INDEX idx_sync_queue_device ON mobile_sync_queue(device_id, created_at);
```

#### 2. **mobile_sessions** (Tracking de Sesiones)
```sql
CREATE TABLE mobile_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    device_id VARCHAR(255) NOT NULL,
    device_info JSONB, -- { os: 'iOS 17', model: 'iPhone 14', app_version: '1.2.0' }
    programa_semanal_id UUID REFERENCES programa_semanal(id),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    actions_count INT DEFAULT 0,
    is_offline BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **mobile_activity_log** (Auditoría Móvil)
```sql
CREATE TABLE mobile_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES mobile_sessions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type VARCHAR(100) NOT NULL, -- 'puntaje_otorgado', 'asistencia_marcada'
    entity_type VARCHAR(50) NOT NULL,  -- 'puntaje', 'asistencia'
    entity_id UUID,
    metadata JSONB, -- Datos contextuales
    was_offline BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_log_session ON mobile_activity_log(session_id);
CREATE INDEX idx_activity_log_user_date ON mobile_activity_log(user_id, created_at);
```

#### 4. **mobile_cache_metadata** (Gestión de Cache)
```sql
CREATE TABLE mobile_cache_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) NOT NULL,
    cache_key VARCHAR(255) NOT NULL, -- 'scouts_activos', 'programa_semana_actual'
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    records_count INT,
    size_bytes BIGINT,
    checksum VARCHAR(64), -- Para validar integridad
    UNIQUE(device_id, cache_key)
);
```

---

## 🔄 Flujo de Sincronización

### **Caso: Otorgar Puntajes Offline**

```
1. Usuario abre app → Carga cache local
   ├── Scouts activos
   ├── Programa semanal
   └── Patrullas

2. Usuario otorga puntaje → Se guarda localmente
   ├── Insert en tabla local 'puntajes_pendientes'
   ├── Estado: 'pending_sync'
   └── Timestamp: 2026-01-12 15:30:00

3. App detecta conexión → Inicia sincronización
   ├── POST /api/mobile/sync/puntajes
   ├── Backend valida:
   │   ├── ¿Programa aún activo?
   │   ├── ¿Usuario tiene permisos?
   │   └── ¿Puntaje duplicado? (deduplicación)
   └── Backend responde:
       ├── Success: Marca como 'synced'
       └── Conflict: Muestra modal de resolución

4. Confirmación visual → Toast "✅ 3 puntajes sincronizados"
```

### **Resolución de Conflictos**

**Estrategia: Last Write Wins (LWW) con Validaciones**

```typescript
// Ejemplo de lógica de resolución
interface SyncConflict {
  local_record: PuntajeLocal;
  server_record: PuntajeServer;
  conflict_type: 'duplicate' | 'outdated' | 'deleted';
}

function resolveConflict(conflict: SyncConflict): Resolution {
  switch (conflict.conflict_type) {
    case 'duplicate':
      // Si ya existe, ignorar local
      return { action: 'discard_local', reason: 'Ya sincronizado' };
    
    case 'outdated':
      // Si programa ya cerró, rechazar
      return { action: 'reject', reason: 'Programa finalizado' };
    
    case 'deleted':
      // Si entidad fue eliminada en servidor
      return { action: 'discard_local', reason: 'Registro eliminado' };
  }
}
```

---

## 🎨 Diseño UX/UI Móvil

### **Principios de Diseño**

#### 1. **Offline-First Visual Feedback**
```
┌─────────────────────────┐
│  🏕️  Programa Semanal   │
│  ─────────────────────  │
│  🟢 Online - Todo sync   │  ← Indicador de estado
│                         │
│  📶 Sin conexión        │  ← Modo offline visible
│  Se sincronizará auto   │
└─────────────────────────┘
```

#### 2. **Acciones Rápidas (Puntajes)**
```
┌─────────────────────────────────┐
│  Actividad: Carrera de Postas   │
│  Competencia: Velocidad         │
│  ─────────────────────────────  │
│                                 │
│  🦅 Águilas            [+5] [+3] [+1]  │
│  🐺 Lobos              [+5] [+3] [+1]  │
│  🦁 Leones             [+5] [+3] [+1]  │
│  🐻 Osos               [+5] [+3] [+1]  │
│                                 │
│  Total Águilas: 23 pts 🏆       │
└─────────────────────────────────┘
```

#### 3. **Asistencia Rápida (Swipe)**
```
┌─────────────────────────────────┐
│  📅 Asistencia: 12/01/2026      │
│  🏕️ Rama: Tropa Scout           │
│  ─────────────────────────────  │
│                                 │
│  ✅ Baudazio, Juan     [Presente]│  ← Swipe right = Presente
│  ⏰ Pérez, María       [Tardanza]│  ← Swipe left = Ausente
│  ❌ García, Pedro      [Ausente] │  ← Tap = Opciones
│  ✅ López, Ana         [Presente]│
│                                 │
│  Progreso: 15/20 (75%)          │
│  [Sincronizar Ahora]            │
└─────────────────────────────────┘
```

#### 4. **Navegación Bottom Tab**
```
┌─────────────────────────────────┐
│         [Contenido]             │
│                                 │
└─────────────────────────────────┘
  🏠      📊      ✓      👥
 Inicio  Puntajes Asistencia Scouts
```

### **Navegación por Funcionalidad**

#### **Módulo: Puntajes**
```
Home → Programa Semanal
  ↓
Actividad del Día
  ↓
Otorgar Puntajes (por competencia)
  ↓
Confirmación + Ranking en vivo
```

#### **Módulo: Asistencia**
```
Home → Asistencia
  ↓
Seleccionar Rama/Patrulla
  ↓
Lista de Scouts (swipe/tap)
  ↓
Confirmación + Estadísticas
```

#### **Módulo: Scouts**
```
Home → Scouts
  ↓
Buscar/Filtrar
  ↓
Ficha de Scout (solo lectura)
```

---

## 🔐 Seguridad y Permisos

### **Sistema de Roles Móvil**

```typescript
enum MobileRole {
  DIRIGENTE = 'dirigente',           // Acceso completo
  ASISTENTE = 'asistente',           // Solo lectura + asistencia
  MONITOR_PUNTAJES = 'monitor',      // Solo puntajes
  SCOUT = 'scout'                    // Solo ver sus datos
}

interface MobilePermissions {
  can_mark_attendance: boolean;
  can_assign_scores: boolean;
  can_view_all_scouts: boolean;
  can_edit_programa: boolean;
}
```

### **Autenticación**

1. **Login con Supabase Auth**
   - Email/Password
   - OAuth (Google, Apple Sign-In)
   - Biométricos (Face ID, Touch ID)

2. **Sesiones Persistentes**
   - Token JWT almacenado en Secure Storage
   - Refresh automático
   - Expiración: 7 días

3. **Validación Offline**
   - Cache de permisos en dispositivo
   - Validación en servidor al sincronizar

---

## 📦 APIs Backend Necesarias

### **1. Mobile Sync API**

#### `POST /api/mobile/sync/batch`
Sincronización masiva de cambios locales

```typescript
// Request
{
  device_id: "iPhone14_abc123",
  user_id: "uuid",
  operations: [
    {
      type: "puntaje",
      action: "insert",
      data: {
        patrulla_id: "uuid",
        actividad_id: "uuid",
        puntaje: 5,
        timestamp: "2026-01-12T15:30:00Z"
      }
    },
    {
      type: "asistencia",
      action: "upsert",
      data: {
        scout_id: "uuid",
        actividad_id: "uuid",
        estado: "PRESENTE",
        timestamp: "2026-01-12T15:00:00Z"
      }
    }
  ]
}

// Response
{
  success: true,
  synced: 15,
  conflicts: 2,
  failed: 0,
  conflict_details: [
    {
      operation_index: 3,
      reason: "duplicate_entry",
      server_data: {...}
    }
  ]
}
```

#### `GET /api/mobile/cache/scouts?rama=tropa`
Obtener datos para cache inicial

```typescript
// Response
{
  scouts: [
    {
      id: "uuid",
      codigo_scout: "SC001",
      nombres: "Juan",
      apellidos: "Baudazio",
      rama_actual: "tropa",
      patrulla: "Águilas",
      foto_url: "https://...",
      estado: "activo"
    }
  ],
  cache_metadata: {
    timestamp: "2026-01-12T14:00:00Z",
    checksum: "sha256hash",
    total_records: 45
  }
}
```

#### `GET /api/mobile/programa/current`
Programa semanal activo

```typescript
// Response
{
  programa: {
    id: "uuid",
    tema_central: "Nudos y Amarres",
    fecha_inicio: "2026-01-12",
    rama: "tropa",
    actividades: [
      {
        id: "uuid",
        titulo: "Competencia de Nudos",
        hora_inicio: "15:00",
        competencias: ["velocidad", "precision"],
        puntaje_maximo: 10
      }
    ]
  }
}
```

### **2. RPC Functions para Móvil**

```sql
-- Obtener resumen rápido para móvil
CREATE OR REPLACE FUNCTION api_mobile_get_session_data(
    p_user_id UUID,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'programa_actual', (
            SELECT row_to_json(ps.*)
            FROM programa_semanal ps
            WHERE ps.fecha_inicio <= p_fecha
              AND ps.fecha_fin >= p_fecha
            LIMIT 1
        ),
        'scouts_activos', (
            SELECT json_agg(row_to_json(s.*))
            FROM (
                SELECT id, codigo_scout, nombres, apellidos, rama_actual
                FROM scouts
                WHERE estado = 'activo'
                ORDER BY apellidos, nombres
            ) s
        ),
        'patrullas', (
            SELECT json_agg(row_to_json(p.*))
            FROM patrullas p
            WHERE p.activa = true
        ),
        'user_permissions', (
            SELECT jsonb_build_object(
                'can_mark_attendance', true,
                'can_assign_scores', true
            )
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚀 Plan de Implementación

### **Fase 1: MVP (4-6 semanas)**

**Semana 1-2: Setup y Arquitectura**
- [ ] Configurar proyecto React Native + Expo
- [ ] Configurar WatermelonDB (local database)
- [ ] Integrar Supabase Client
- [ ] Sistema de autenticación
- [ ] Navegación básica (bottom tabs)

**Semana 3-4: Funcionalidad Core**
- [ ] Módulo de Scouts (lista, búsqueda, filtros)
- [ ] Módulo de Asistencia (marca, sync)
- [ ] Sistema de sincronización básico
- [ ] Indicadores offline/online

**Semana 5-6: Puntajes y Testing**
- [ ] Módulo de Puntajes
- [ ] Visualización de ranking
- [ ] Testing en dispositivos reales
- [ ] Resolución de bugs

### **Fase 2: Optimización (2-3 semanas)**
- [ ] Performance optimization
- [ ] Manejo avanzado de conflictos
- [ ] Push notifications
- [ ] Analytics y tracking

### **Fase 3: Release (1-2 semanas)**
- [ ] Preparación para stores (iOS App Store, Google Play)
- [ ] Screenshots y descripción
- [ ] Revisión de privacidad/seguridad
- [ ] Publicación

---

## 📱 Estructura del Proyecto Móvil

```
scout-mobile-app/
├── src/
│   ├── api/                    # Supabase client + endpoints
│   │   ├── supabase.ts
│   │   ├── scouts.ts
│   │   ├── asistencia.ts
│   │   └── puntajes.ts
│   ├── database/               # WatermelonDB schemas
│   │   ├── schema.ts
│   │   ├── models/
│   │   │   ├── Scout.ts
│   │   │   ├── Asistencia.ts
│   │   │   └── Puntaje.ts
│   │   └── sync.ts
│   ├── screens/
│   │   ├── Home/
│   │   ├── Scouts/
│   │   ├── Asistencia/
│   │   ├── Puntajes/
│   │   └── Auth/
│   ├── components/
│   │   ├── ScoutCard.tsx
│   │   ├── AsistenciaRow.tsx
│   │   ├── PuntajeButton.tsx
│   │   └── SyncIndicator.tsx
│   ├── hooks/
│   │   ├── useOfflineSync.ts
│   │   ├── useScouts.ts
│   │   └── useAuth.ts
│   ├── store/                  # Zustand state
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── cacheStore.ts
│   └── utils/
│       ├── offlineQueue.ts
│       ├── conflictResolver.ts
│       └── validation.ts
├── app.json
├── package.json
└── tsconfig.json
```

---

## 💡 Mejores Prácticas

### **1. Performance**
- ✅ Lazy loading de imágenes
- ✅ Virtualización de listas largas (FlatList)
- ✅ Memoización de componentes pesados
- ✅ Throttling de búsquedas
- ✅ Paginación en queries

### **2. UX Móvil**
- ✅ Touch targets mínimo 44x44pt
- ✅ Feedback táctil (haptics)
- ✅ Animaciones suaves (60fps)
- ✅ Estados de carga skeleton
- ✅ Gestos intuitivos (swipe, long press)

### **3. Offline-First**
- ✅ Cache agresivo de datos estáticos
- ✅ Cola de sincronización persistente
- ✅ Indicadores visuales claros
- ✅ Manejo de errores de red
- ✅ Retry automático inteligente

### **4. Seguridad**
- ✅ Nunca almacenar contraseñas
- ✅ Encriptar datos sensibles en device
- ✅ Validar permisos en cada operación
- ✅ HTTPS obligatorio
- ✅ Certificate pinning (producción)

---

## 📊 Métricas de Éxito

### **KPIs Técnicos**
- Tiempo de carga inicial: < 2s
- Tiempo de sincronización: < 5s por 100 registros
- Tasa de conflictos: < 2%
- Crash-free rate: > 99.5%

### **KPIs de Negocio**
- Adopción: > 80% dirigentes activos
- Uso offline: > 40% sesiones
- Tiempo de registro asistencia: -60% vs manual
- Satisfacción usuario: > 4.5/5

---

## 🔄 Mantenimiento y Actualización

### **Versionamiento**
- Semantic versioning: `MAJOR.MINOR.PATCH`
- Ejemplo: `1.2.3`
  - MAJOR: Cambios incompatibles
  - MINOR: Nuevas funcionalidades
  - PATCH: Bug fixes

### **Over-the-Air Updates (OTA)**
- Usar Expo Updates para cambios JS/assets
- No requiere aprobación de tiendas
- Actualizaciones en < 24h

### **Monitoreo**
- Crashlytics (Firebase)
- Analytics (Mixpanel o Amplitude)
- Performance Monitoring
- User feedback in-app

---

## 💰 Estimación de Costos

### **Desarrollo**
- MVP (6 semanas): ~240 horas
- Optimización: ~80 horas
- Testing y QA: ~40 horas
- **Total:** ~360 horas de desarrollo

### **Infraestructura (mensual)**
- Supabase: $25/mes (incluido en plan actual)
- Expo EAS Build: $29/mes
- Firebase (push + analytics): $0 (free tier)
- Apple Developer: $99/año
- Google Play: $25 one-time
- **Total mensual:** ~$30-40

---

## 🎯 Recomendación Final

**Stack Óptimo:**
```
Frontend: React Native + Expo + TypeScript
Backend: Supabase (ya existente)
Local DB: WatermelonDB
State: Zustand
Navigation: React Navigation
```

**Prioridad de Funcionalidades:**
1. **Asistencia** (más usado, mayor impacto)
2. **Lista Scouts** (base para otras features)
3. **Puntajes** (más complejo, menor uso)

**Timeline Realista:**
- MVP funcional: 6 semanas
- App en tiendas: 8-10 semanas
- Adopción completa: 3 meses post-launch

---

## 📚 Recursos de Referencia

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [WatermelonDB](https://watermelondb.dev/)
- [Supabase Mobile Guide](https://supabase.com/docs/guides/getting-started/tutorials)
- [Offline-First Architecture](https://offlinefirst.org/)

---

**¿Necesitas que desarrolle alguna sección en detalle o creamos un prototipo de una funcionalidad específica?**
