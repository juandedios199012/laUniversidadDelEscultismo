# 🔐 ARQUITECTURA DE SEGURIDAD MULTI-TENANT SAAS

## 📊 MODELO DE DATOS PROPUESTO

### 1. TABLA: auth_users (ya existe en Supabase)
```sql
-- Usuarios del sistema
id (uuid)
email
encrypted_password
-- Supabase Auth maneja esto
```

### 2. TABLA: grupo_scout_users (NUEVA)
```sql
CREATE TABLE grupo_scout_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    grupo_scout_id UUID REFERENCES grupos_scout(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'dirigente', -- dirigente, admin, colaborador
    activo BOOLEAN DEFAULT true,
    fecha_ingreso TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Un usuario puede pertenecer a múltiples grupos pero con diferentes roles
    UNIQUE(user_id, grupo_scout_id)
);
```

### 3. ROW LEVEL SECURITY en todas las tablas
```sql
-- Ejemplo para tabla scouts
ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see scouts from their group" ON scouts
FOR ALL USING (
    grupo_scout_id IN (
        SELECT grupo_scout_id 
        FROM grupo_scout_users 
        WHERE user_id = auth.uid() 
        AND activo = true
    )
);
```

## 🎯 ROLES Y PERMISOS PROPUESTOS

### **SUPER_ADMIN** (Administrador del Sistema)
- Acceso a todos los grupos scout
- Gestión de subscripciones
- Configuración global del sistema
- Analytics completos

### **GRUPO_ADMIN** (Administrador de Grupo Scout)
- Acceso completo a SU grupo scout
- Puede invitar/remover dirigentes
- Configurar datos del grupo
- Acceso a todos los módulos de su grupo

### **DIRIGENTE** (Dirigente de Grupo Scout)
- Acceso a scouts de SU grupo
- Crear/editar actividades de su grupo
- Ver reportes de su grupo
- No puede gestionar otros dirigentes

### **COLABORADOR** (Lectura limitada)
- Solo lectura de scouts de su grupo
- No puede editar información crítica

## 🔑 FLUJO DE AUTENTICACIÓN PROPUESTO

1. **Login** → Supabase Auth
2. **Verificar grupos** → ¿A qué grupos pertenece el usuario?
3. **Seleccionar grupo activo** → Si pertenece a múltiples grupos
4. **Establecer contexto** → Todas las queries filtradas por grupo_activo
5. **RLS automático** → Base de datos filtra automáticamente

## 🏢 GESTIÓN DE TENANTS (GRUPOS SCOUT)

### Creación de Nuevo Grupo Scout:
```typescript
// 1. Crear grupo scout
const nuevoGrupo = await crearGrupoScout(datosGrupo);

// 2. Asignar primer admin
await asignarUsuarioAGrupo({
    user_id: userId,
    grupo_scout_id: nuevoGrupo.id,
    role: 'GRUPO_ADMIN'
});

// 3. Crear configuración inicial del grupo
await crearConfiguracionInicialGrupo(nuevoGrupo.id);
```

## 🛡️ BUENAS PRÁCTICAS DE SEGURIDAD

### 1. **Nunca enviar grupo_id desde frontend**
```typescript
// ❌ MAL - El frontend puede manipular el grupo_id
const scouts = await getScouts(grupoId); 

// ✅ BIEN - El backend obtiene el grupo del usuario autenticado
const scouts = await getScoutsDeGrupoActual();
```

### 2. **Validación en el backend**
```sql
-- RLS se ejecuta automáticamente
-- No hay forma de bypassear desde el frontend
```

### 3. **Logging y auditoría**
```typescript
// Registrar todas las acciones críticas
await logAction({
    user_id: auth.user.id,
    grupo_id: contexto.grupo_activo,
    action: 'CREATE_SCOUT',
    resource: 'scouts',
    details: { scout_id: newScout.id }
});
```

## 📊 MIGRACIÓN DE DATOS EXISTENTES

### Script de migración propuesto:
```sql
-- 1. Agregar grupo_scout_id a tablas existentes
ALTER TABLE scouts ADD COLUMN grupo_scout_id UUID REFERENCES grupos_scout(id);

-- 2. Crear un grupo "default" para datos existentes
INSERT INTO grupos_scout (nombre, numeral, localidad, region, fecha_fundacion) 
VALUES ('Grupo Scout Lima 12', '12', 'Lima', 'Lima', '2020-01-01');

-- 3. Asignar todos los scouts existentes al grupo default
UPDATE scouts SET grupo_scout_id = (SELECT id FROM grupos_scout LIMIT 1);

-- 4. Aplicar RLS
ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;
```

## 🎨 CAMBIOS EN LA INTERFAZ

### 1. **Selector de Grupo Activo**
```tsx
// En el header de la aplicación
<GrupoScoutSelector 
    gruposUsuario={gruposUsuario}
    grupoActivo={grupoActivo}
    onCambiarGrupo={cambiarGrupoActivo}
/>
```

### 2. **Contexto de Grupo**
```tsx
// Context provider para mantener grupo activo
<GrupoScoutProvider grupoActivo={grupoActivo}>
    <App />
</GrupoScoutProvider>
```

## 📈 ESCALABILIDAD CONSIDERACIONES

### 1. **Performance**
- Índices en grupo_scout_id en todas las tablas
- Cache de permisos de usuario
- Paginación consciente de tenant

### 2. **Almacenamiento**
- Cada grupo scout = tenant separado lógicamente
- Datos compartidos (catálogos) en tablas globales

### 3. **Backup y Recovery**
- Backup por grupo scout
- Posibilidad de exportar datos de un grupo específico

## 🚀 FASES DE IMPLEMENTACIÓN

### **FASE 1: Fundación de Seguridad**
- [ ] Crear tabla grupo_scout_users
- [ ] Implementar RLS básico
- [ ] Migrar datos existentes

### **FASE 2: Autenticación Multi-tenant**
- [ ] Implementar login con selección de grupo
- [ ] Context provider de grupo activo
- [ ] Middleware de seguridad

### **FASE 3: UI Multi-tenant**
- [ ] Selector de grupo en header
- [ ] Branding por grupo scout
- [ ] Configuraciones específicas por grupo

### **FASE 4: Características Avanzadas**
- [ ] Invitaciones por email
- [ ] Gestión de subscripciones
- [ ] Analytics por grupo
- [ ] Backup/Export de datos

## 💰 MODELO DE MONETIZACIÓN SUGERIDO

### **Plan Básico** (Gratis)
- 1 grupo scout
- Hasta 50 scouts
- Funciones básicas

### **Plan Pro** ($10/mes por grupo)
- Grupos ilimitados
- Scouts ilimitados
- Reportes avanzados
- Soporte prioritario

### **Plan Enterprise** (Personalizado)
- White label
- SSO
- API access
- Soporte dedicado