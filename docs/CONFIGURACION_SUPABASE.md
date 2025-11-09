# 🚀 Guía Visual: Configuración de Supabase Real

## 📱 Paso 1: Crear Proyecto en Supabase

### 1.1 Accede a Supabase
- 🌐 Ve a **https://supabase.com**
- 🔐 Haz clic en **"Start your project"**
- 📧 Inicia sesión con **GitHub**, **Google** o email

### 1.2 Crear Nuevo Proyecto
```
┌─────────────────────────────────────┐
│  🏗️  Create a new project          │
├─────────────────────────────────────┤
│  Name: scout-inventario-lima12      │
│  Organization: [tu organización]    │
│  Database Password: [genera una]    │
│  Region: US East (N. Virginia)      │
│  Pricing Plan: Free                 │
│                                     │
│  [Create new project] 🚀            │
└─────────────────────────────────────┘
```

⏰ **Espera 2-3 minutos** mientras Supabase configura tu proyecto

---

## 🔑 Paso 2: Obtener Credenciales

### 2.1 Navegar a Settings → API
```
Panel Izquierdo:
├── Dashboard
├── Table Editor  
├── SQL Editor
├── ...
└── ⚙️  Settings
    └── 🔌 API  ← HAZ CLIC AQUÍ
```

### 2.2 Copiar Credenciales
```
┌─────────────────────────────────────┐
│  🔗 Project URL                     │
│  https://xyzabc123.supabase.co      │ ← COPIA ESTO
├─────────────────────────────────────┤
│  🔑 API Keys                        │
│  anon/public: eyJhbGciOi...         │ ← COPIA ESTO
│  service_role: eyJhbGciOi... 🔒     │ ← NO USES ESTE
└─────────────────────────────────────┘
```

---

## 🗄️ Paso 3: Configurar Base de Datos

### 3.1 Navegar a SQL Editor
```
Panel Izquierdo:
├── Dashboard
├── Table Editor
├── 📝 SQL Editor  ← HAZ CLIC AQUÍ
├── Authentication
└── ...
```

### 3.2 Ejecutar Script
1. **Haz clic en "New query"**
2. **Borra el contenido por defecto**
3. **Copia TODO el contenido** de `database/setup_inventario.sql`
4. **Pega en el editor SQL**
5. **Haz clic en "Run"** (▶️)

### 3.3 Verificar Resultados
Deberías ver mensajes como:
```
✅ CREATE TABLE
✅ CREATE INDEX
✅ CREATE FUNCTION
✅ CREATE TRIGGER
✅ INSERT 0 8
✅ ALTER TABLE
✅ CREATE POLICY
```

---

## 🔧 Paso 4: Actualizar Variables de Entorno

### 4.1 Editar .env.local
Abre el archivo `.env.local` y reemplaza:

```bash
# ANTES (valores de ejemplo):
VITE_SUPABASE_URL=https://xyzexample.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.key

# DESPUÉS (tus valores reales):
VITE_SUPABASE_URL=https://TU-PROYECTO-REAL.supabase.co
VITE_SUPABASE_ANON_KEY=TU-API-KEY-REAL-AQUI
```

### 4.2 Guardar Archivo
- **💾 Guarda** el archivo `.env.local`
- **🔄 Reinicia** el servidor de desarrollo

---

## ✅ Paso 5: Verificar Configuración

### 5.1 Probar Conexión
```bash
# En la terminal:
cd /ruta/a/tu/proyecto
node test-supabase.js
```

### 5.2 Resultados Esperados
```
🔍 Probando conexión con Supabase...
URL: https://tu-proyecto.supabase.co
Key: eyJhbGciOiJIUzI1NiI...

📋 Probando consulta a la tabla inventario...
✅ Conexión exitosa!
📊 Items en inventario: 8

🧪 Probando inserción de datos...
✅ Datos de ejemplo encontrados:
  - Carpa 4 personas (ID: 12345678...)
  - Pañoleta Scout (ID: 87654321...)
  - Botiquín Primeros Auxilios (ID: 11223344...)

🎉 ¡Supabase configurado correctamente!
🚀 Tu aplicación está lista para usar la base de datos real.
```

---

## 🚨 Troubleshooting

### ❌ Error: "Variables de entorno no configuradas"
**Solución:** Verifica que `.env.local` tenga las credenciales correctas

### ❌ Error: "relation 'inventario' does not exist"  
**Solución:** El script SQL no se ejecutó. Ve a SQL Editor y ejecuta `database/setup_inventario.sql`

### ❌ Error: "Invalid API key"
**Solución:** Verifica que copiaste la clave `anon/public` y no la `service_role`

### ❌ Error: "Row Level Security policy violation"
**Solución:** Las políticas RLS están habilitadas. El script debería configurarlas automáticamente.

---

## 🎯 Siguiente Paso

Una vez que veas "✅ Conexión exitosa!" puedes:

1. **🔄 Reiniciar** el servidor de desarrollo: `npm run dev`
2. **🌐 Abrir** http://localhost:3000
3. **📦 Navegar** al módulo "Inventario" 
4. **🎉 ¡Ver** tu inventario funcionando con datos reales!

---

**💡 Tip:** Guarda tus credenciales de Supabase en un lugar seguro. ¡Las necesitarás para futuras configuraciones!