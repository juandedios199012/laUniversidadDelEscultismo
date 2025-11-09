# 📚 API Documentation - Sistema Scout Lima 12

## 🏗️ **Arquitectura de Database Functions**

El Sistema Scout Lima 12 utiliza una arquitectura basada en **Database Functions** en PostgreSQL que actúa como capa de abstracción entre los servicios y la base de datos, proporcionando:

- ✅ **Validación de datos** a nivel de base de datos
- ✅ **Lógica de negocio** centralizada
- ✅ **Performance optimizado** con índices estratégicos
- ✅ **Seguridad** con Row Level Security (RLS)
- ✅ **Consistencia** de datos garantizada

---

## 📊 **Resumen de Funciones por Módulo**

| Módulo | Archivo | Funciones | Descripción |
|--------|---------|-----------|-------------|
| **Inventario** | `05_functions_inventario.sql` | ~25 | Gestión de inventario, movimientos, préstamos |
| **Scouts** | `06_functions_scouts.sql` | ~30 | Registro, gestión y estadísticas de scouts |
| **Presupuestos** | `07_functions_presupuestos.sql` | ~20 | Gestión financiera y análisis económico |
| **Asistencia** | `08_functions_asistencia.sql` | ~25 | Registro y control de asistencias |
| **Dirigentes** | `09_functions_dirigentes.sql` | ~20 | Gestión de dirigentes y formación |
| **Patrullas** | `10_functions_patrullas.sql` | ~15 | Administración de patrullas y puntos |
| **Comité Padres** | `11_functions_comite_padres.sql` | ~15 | Gestión del comité de padres |
| **Libro Oro** | `12_functions_libro_oro.sql` | ~15 | Registros históricos y memoriales |
| **Programa Semanal** | `13_functions_programa_semanal.sql` | ~10 | Planificación de actividades semanales |
| **Inscripción** | `14_functions_inscripcion.sql` | ~10 | Proceso de inscripción anual |
| **Inscripción** | `14_functions_inscripcion.sql` | ~10 | Proceso de inscripción anual |
| **Actividades** | `15_functions_actividades.sql` | ~15 | Planificación y gestión de actividades |
| **Reportes** | `16_functions_reports.sql` | ~15 | Generación de reportes y analytics |

**Total: ~235 Database Functions**

---

## 🔧 **Convenciones de la API**

### **Nomenclatura de Funciones:**
```sql
-- Patrón: [accion]_[entidad]_[especificacion]
-- Ejemplos:
registrar_scout(...)                    -- Crear nuevo registro
obtener_scout_por_id(...)              -- Obtener por ID
actualizar_datos_scout(...)            -- Actualizar existente
eliminar_scout_logico(...)             -- Eliminación lógica
buscar_scouts_por_criterio(...)        -- Búsqueda con filtros
generar_reporte_scouts(...)            -- Generación de reportes
```

### **Tipos de Retorno Estándar:**
```sql
-- JSON Response Pattern
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "errors": array,
  "metadata": {
    "timestamp": timestamp,
    "total_records": integer,
    "page": integer,
    "limit": integer
  }
}
```

### **Manejo de Errores:**
```sql
-- Estructura de Error Estándar
{
  "success": false,
  "data": null,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo_con_error",
      "code": "ERROR_CODE",
      "message": "Mensaje específico"
    }
  ]
}
```

---

## 🚀 **Guía de Inicio Rápido**

### **1. Configuración Inicial:**
```sql
-- Aplicar esquema completo
\i database/01_schema.sql
\i database/02_functions.sql
\i database/03_security.sql

-- Cargar Database Functions
\i database/05_functions_inventario.sql
\i database/06_functions_scouts.sql
-- ... (todos los módulos)

-- Aplicar optimizaciones
\i database/apply_performance_optimizations.sql
```

### **2. Ejemplo de Uso Básico:**
```sql
-- Registrar un nuevo scout
SELECT registrar_scout(
  p_nombre := 'Juan',
  p_apellidos := 'Pérez García',
  p_fecha_nacimiento := '2010-05-15',
  p_rama := 'LOBATOS',
  p_datos_contacto := '{"telefono": "987654321", "email": "juan@email.com"}'::json
);

-- Respuesta esperada:
{
  "success": true,
  "data": {
    "scout_id": "123e4567-e89b-12d3-a456-426614174000",
    "numero_scout": "SC2024001",
    "estado": "ACTIVO"
  },
  "message": "Scout registrado exitosamente"
}
```

### **3. Búsqueda y Filtrado:**
```sql
-- Buscar scouts por criterios
SELECT buscar_scouts_por_criterio(
  p_filtros := '{
    "rama": "LOBATOS",
    "estado": "ACTIVO",
    "texto_busqueda": "Juan"
  }'::json,
  p_limite := 20,
  p_offset := 0
);
```

---

## 📋 **Documentación por Módulos**

### **Enlaces Rápidos:**
- [📦 Inventario API](./docs/api/inventario.md) - Gestión de materiales y equipos
- [👤 Scouts API](./docs/api/scouts.md) - Registro y gestión de scouts
- [💰 Presupuestos API](./docs/api/presupuestos.md) - Gestión financiera
- [📅 Asistencia API](./docs/api/asistencia.md) - Control de asistencias
- [👨‍🏫 Dirigentes API](./docs/api/dirigentes.md) - Gestión de dirigentes
- [🏕️ Patrullas API](./docs/api/patrullas.md) - Administración de patrullas
- [👨‍👩‍👧‍👦 Comité Padres API](./docs/api/comite_padres.md) - Gestión del comité
- [🏆 Libro Oro API](./docs/api/libro_oro.md) - Registros históricos
- [📝 Programa Semanal API](./docs/api/programa_semanal.md) - Planificación
- [📋 Inscripción API](./docs/api/inscripcion.md) - Proceso de inscripción
- [🎯 Actividades API](./docs/api/actividades.md) - Actividades especiales
- [📊 Reportes API](./docs/api/reportes.md) - Analytics y reportes

---

## 🔐 **Seguridad y Autenticación**

### **Row Level Security (RLS):**
```sql
-- Las funciones incluyen verificación automática de permisos
-- Ejemplo: Solo dirigentes pueden modificar datos sensibles
CREATE POLICY dirigentes_modify_scouts ON scouts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'dirigente');
```

### **Validación de Datos:**
```sql
-- Todas las funciones incluyen validación completa
-- Ejemplo en registrar_scout:
IF p_nombre IS NULL OR LENGTH(TRIM(p_nombre)) < 2 THEN
  RETURN json_build_object(
    'success', false,
    'message', 'El nombre debe tener al menos 2 caracteres'
  );
END IF;
```

---

## ⚡ **Performance y Optimización**

### **Índices Automáticos:**
- ✅ **40+ índices estratégicos** aplicados automáticamente
- ✅ **Índices compuestos** para consultas complejas
- ✅ **Índices de texto completo** para búsquedas

### **Caching Inteligente:**
```sql
-- Funciones con cache automático
SELECT obtener_estadisticas_generales_cached();
SELECT obtener_ranking_patrullas_cached();

-- Cache manual con expiración
SELECT obtener_datos_con_cache('estadisticas_scouts', '{}', false);
```

### **Monitoreo de Performance:**
```sql
-- Verificar salud del sistema
SELECT health_check_performance();

-- Estadísticas de uso
SELECT monitor_performance_scout_system();
```

---

## 🧪 **Testing y Validación**

### **Scripts de Validación:**
```bash
# Ejecutar validación completa
./validate-architecture.sh

# Testing específico de módulos
npm run test:database-functions
npm run test:services-integration
```

### **Funciones de Testing:**
```sql
-- Validar funciones por módulo
SELECT validar_functions_inventario();
SELECT validar_functions_scouts();
-- ... etc para todos los módulos
```

---

## 📱 **Integración con Servicios**

### **Patrón de Integración:**
```typescript
// Ejemplo de servicio TypeScript
export class ScoutService {
  async registrarScout(datosScout: RegistroScoutData) {
    const { data } = await supabase.rpc('registrar_scout', {
      p_nombre: datosScout.nombre,
      p_apellidos: datosScout.apellidos,
      p_fecha_nacimiento: datosScout.fechaNacimiento,
      p_rama: datosScout.rama,
      p_datos_contacto: datosScout.contacto
    });
    
    return data;
  }
}
```

### **Manejo de Errores en Cliente:**
```typescript
// Patrón estándar de manejo de errores
try {
  const resultado = await scoutService.registrarScout(datos);
  
  if (resultado.success) {
    // Éxito
    console.log('Scout registrado:', resultado.data);
  } else {
    // Error de negocio
    console.error('Error:', resultado.message);
    mostrarErrores(resultado.errors);
  }
} catch (error) {
  // Error de conexión/sistema
  console.error('Error del sistema:', error);
}
```

---

## 🔄 **Versionado y Migraciones**

### **Versionado de Funciones:**
```sql
-- Las funciones incluyen información de versión
-- Formato: CREATE OR REPLACE FUNCTION nombre_v2(...)
-- Mantener compatibilidad hacia atrás cuando sea posible
```

### **Migraciones:**
```sql
-- Scripts de migración incluidos en database/migrations/
-- Aplicar en orden secuencial para actualizaciones
```

---

## 📞 **Soporte y Contribución**

### **Reportar Issues:**
- 🐛 **Bugs:** Crear issue con ejemplo reproducible
- 💡 **Features:** Proponer mejoras con casos de uso
- 📖 **Documentación:** Sugerir mejoras o correcciones

### **Desarrollo:**
```bash
# Setup de desarrollo
git clone [repository]
cd laUniversidadDelEscultismo
npm install

# Aplicar configuración de desarrollo
psql -d scout_lima12 -f database/setup_development.sql
```

---

## 📊 **Estado del Sistema**

- ✅ **Database Functions:** 210+ funciones implementadas
- ✅ **Testing:** Sistema de validación automatizada
- ✅ **Performance:** Optimización completa aplicada
- ✅ **Security:** RLS y validaciones implementadas
- ✅ **Documentation:** API completamente documentada

**🎉 Sistema Scout Lima 12 listo para producción**