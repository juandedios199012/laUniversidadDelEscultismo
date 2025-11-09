# 🏆 Libro de Oro API - Sistema Scout Lima 12

## 📋 **Resumen del Módulo**

El módulo de Libro de Oro gestiona los registros históricos, memoriales, reconocimientos especiales y momentos significativos del grupo scout. Contiene **~15 funciones** para preservar y consultar la historia del grupo.

**Archivo:** `database/12_functions_libro_oro.sql`

---

## 🔧 **Funciones Principales**

### **📜 REGISTROS HISTÓRICOS**

#### **1. Crear Entrada en Libro de Oro**
```sql
crear_entrada_libro_oro(
  p_titulo VARCHAR(200),
  p_descripcion TEXT,
  p_tipo_entrada tipo_entrada_enum,
  p_fecha_evento DATE,
  p_participantes JSON DEFAULT '[]',
  p_dirigente_responsable_id UUID,
  p_ubicacion VARCHAR(200) DEFAULT NULL,
  p_importancia_historica INTEGER DEFAULT 5,
  p_evidencias JSON DEFAULT '{}',
  p_palabras_clave JSON DEFAULT '[]'
) RETURNS JSON
```

**Tipos de entrada:**
- `FUNDACION` - Eventos de fundación (grupo, patrullas, etc.)
- `RECONOCIMIENTO` - Reconocimientos especiales y logros destacados
- `CAMPAMENTO_HISTORICO` - Campamentos memorables
- `CEREMONIA_ESPECIAL` - Ceremonias importantes
- `VISITA_IMPORTANTE` - Visitas de personalidades
- `ANIVERSARIO` - Aniversarios del grupo
- `LOGRO_GRUPAL` - Logros significativos del grupo
- `MEMORIAL` - Memoriales y homenajes
- `PROYECTO_COMUNITARIO` - Proyectos de impacto comunitario
- `TRADICION_INICIO` - Inicio de tradiciones del grupo

**Ejemplo:**
```sql
SELECT crear_entrada_libro_oro(
  p_titulo := 'Primer Campamento Nacional - Patrulla Águilas',
  p_descripcion := 'La Patrulla Águilas Doradas participó por primera vez en el Campamento Nacional de Scouts del Perú, representando dignamente al Grupo Scout Lima 12. Obtuvieron el segundo lugar en la competencia de campismo y el primer lugar en orientación.',
  p_tipo_entrada := 'LOGRO_GRUPAL',
  p_fecha_evento := '2024-07-15',
  p_participantes := '[
    {"scout_id": "scout123", "nombre": "Juan Pérez", "cargo": "Jefe de Patrulla"},
    {"scout_id": "scout456", "nombre": "María García", "cargo": "Subjefe"},
    {"dirigente_id": "dir123", "nombre": "Carlos Rodríguez", "cargo": "Dirigente"}
  ]'::json,
  p_dirigente_responsable_id := 'dir123-456-789',
  p_ubicacion := 'Campamento Nacional, Huacachina - Ica',
  p_importancia_historica := 8,
  p_evidencias := '{
    "fotos": ["foto001.jpg", "foto002.jpg", "ceremonia.jpg"],
    "videos": ["campamento_eagles.mp4"],
    "documentos": ["certificado_participacion.pdf", "acta_premiacion.pdf"],
    "testimonios": ["testimonio_jefe_patrulla.txt"]
  }'::json,
  p_palabras_clave := '["campamento", "nacional", "aguilas", "primer lugar", "orientacion", "representacion"]'::json
);
```

#### **2. Actualizar Entrada Libro de Oro**
```sql
actualizar_entrada_libro_oro(
  p_entrada_id UUID,
  p_datos_actualizacion JSON
) RETURNS JSON
```

#### **3. Obtener Entrada por ID**
```sql
obtener_entrada_libro_oro(p_entrada_id UUID) RETURNS JSON
```

---

### **🔍 BÚSQUEDA Y CONSULTA**

#### **4. Buscar Entradas por Criterios**
```sql
buscar_entradas_libro_oro(
  p_filtros JSON DEFAULT '{}',
  p_orden_por VARCHAR(50) DEFAULT 'fecha_evento',
  p_orden_direccion VARCHAR(10) DEFAULT 'DESC',
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

**Filtros disponibles:**
```json
{
  "tipo_entrada": "LOGRO_GRUPAL",
  "fecha_desde": "2020-01-01",
  "fecha_hasta": "2024-12-31",
  "palabras_clave": ["campamento", "nacional"],
  "participante_id": "scout123-456-789",
  "importancia_minima": 7,
  "texto_busqueda": "Águilas",
  "ubicacion_contiene": "Huacachina",
  "dirigente_responsable": "dir123-456-789"
}
```

#### **5. Búsqueda por Texto Completo**
```sql
buscar_texto_completo_libro_oro(
  p_texto_busqueda TEXT,
  p_limite INTEGER DEFAULT 20
) RETURNS JSON
```

#### **6. Obtener Cronología Histórica**
```sql
obtener_cronologia_historica(
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_tipos_entrada JSON DEFAULT '[]'
) RETURNS JSON
```

---

### **🏆 RECONOCIMIENTOS Y LOGROS**

#### **7. Registrar Reconocimiento Especial**
```sql
registrar_reconocimiento_especial(
  p_scout_id UUID DEFAULT NULL,
  p_dirigente_id UUID DEFAULT NULL,
  p_patrulla_id UUID DEFAULT NULL,
  p_tipo_reconocimiento VARCHAR(100),
  p_descripcion_logro TEXT,
  p_institucion_otorgante VARCHAR(150),
  p_fecha_reconocimiento DATE,
  p_nivel_reconocimiento nivel_reconocimiento_enum,
  p_certificado_url TEXT DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSON
```

**Niveles de reconocimiento:**
- `LOCAL` - Reconocimiento local
- `DISTRITAL` - Reconocimiento distrital
- `REGIONAL` - Reconocimiento regional
- `NACIONAL` - Reconocimiento nacional
- `INTERNACIONAL` - Reconocimiento internacional

#### **8. Obtener Reconocimientos por Scout**
```sql
obtener_reconocimientos_scout(p_scout_id UUID) RETURNS JSON
```

#### **9. Generar Hall of Fame**
```sql
generar_hall_of_fame(
  p_categoria VARCHAR(100) DEFAULT 'TODOS',
  p_limite INTEGER DEFAULT 50
) RETURNS JSON
```

---

### **📸 GESTIÓN DE EVIDENCIAS**

#### **10. Agregar Evidencia a Entrada**
```sql
agregar_evidencia_entrada(
  p_entrada_id UUID,
  p_tipo_evidencia VARCHAR(50),
  p_url_evidencia TEXT,
  p_descripcion VARCHAR(200) DEFAULT NULL,
  p_metadata JSON DEFAULT '{}'
) RETURNS JSON
```

**Tipos de evidencia:**
- `FOTOGRAFIA` - Fotografías del evento
- `VIDEO` - Videos documentales
- `DOCUMENTO` - Documentos oficiales
- `TESTIMONIO` - Testimonios escritos
- `AUDIO` - Grabaciones de audio
- `CERTIFICADO` - Certificados y diplomas
- `PERIODICO` - Recortes de periódico
- `CORRESPONDENCIA` - Cartas y correspondencia

#### **11. Obtener Evidencias de Entrada**
```sql
obtener_evidencias_entrada(p_entrada_id UUID) RETURNS JSON
```

#### **12. Generar Álbum Fotográfico**
```sql
generar_album_fotografico(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_tipo_entrada tipo_entrada_enum DEFAULT NULL,
  p_limite_fotos INTEGER DEFAULT 100
) RETURNS JSON
```

---

### **📊 ESTADÍSTICAS HISTÓRICAS**

#### **13. Estadísticas del Libro de Oro**
```sql
obtener_estadisticas_libro_oro() RETURNS JSON
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_entradas": 156,
    "por_tipo": {
      "LOGRO_GRUPAL": 35,
      "CAMPAMENTO_HISTORICO": 28,
      "RECONOCIMIENTO": 22,
      "CEREMONIA_ESPECIAL": 18,
      "ANIVERSARIO": 12,
      "MEMORIAL": 8,
      "OTROS": 33
    },
    "por_decada": {
      "2020-2029": 89,
      "2010-2019": 45,
      "2000-2009": 22
    },
    "reconocimientos_especiales": 67,
    "scouts_en_hall_of_fame": 25,
    "evidencias_totales": {
      "fotografias": 1250,
      "videos": 89,
      "documentos": 234,
      "testimonios": 156
    },
    "entrada_mas_antigua": "2001-03-15",
    "ultima_actualizacion": "2024-10-24"
  }
}
```

#### **14. Análisis de Participación Histórica**
```sql
analizar_participacion_historica(
  p_scout_id UUID DEFAULT NULL,
  p_dirigente_id UUID DEFAULT NULL,
  p_patrulla_id UUID DEFAULT NULL
) RETURNS JSON
```

#### **15. Generar Resumen Anual**
```sql
generar_resumen_anual_libro_oro(
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
) RETURNS JSON
```

---

## 🔒 **Validaciones y Reglas de Negocio**

### **Validaciones Automáticas:**
- ✅ **Fecha coherente** - No permitir fechas futuras para eventos históricos
- ✅ **Evidencias válidas** - Verificar URLs y formatos de evidencias
- ✅ **Participantes existentes** - Validar que scouts/dirigentes existan
- ✅ **Importancia histórica** - Escala 1-10 para clasificar relevancia
- ✅ **Información mínima** - Título y descripción obligatorios

### **Reglas de Preservación:**
```sql
-- Entradas no pueden eliminarse, solo marcarse como archivadas
-- Evidencias se respaldan automáticamente
-- Acceso de escritura solo para dirigentes autorizados
-- Auditoría completa de todas las modificaciones
```

---

## 📊 **Performance y Optimización**

### **Índices Estratégicos:**
- `idx_libro_oro_fecha_tipo` - Búsquedas por fecha y tipo
- `idx_libro_oro_participantes_gin` - Búsqueda en participantes JSON
- `idx_libro_oro_palabras_clave_gin` - Búsqueda de texto completo
- `idx_libro_oro_importancia` - Filtros por importancia histórica

### **Archive Strategy:**
```sql
-- Particionado por décadas para mejor performance
-- Índices especializados para búsquedas históricas
-- Cache de consultas frecuentes (últimos eventos, hall of fame)
```

---

## 🧪 **Testing y Validación**

### **Funciones de Prueba:**
```sql
-- Validar módulo completo
SELECT validar_functions_libro_oro();

-- Generar entradas históricas de prueba
SELECT generar_datos_prueba_libro_oro(50);

-- Test de búsquedas
SELECT test_busquedas_libro_oro();
```

---

## 📱 **Integración con Frontend**

### **Ejemplo TypeScript:**
```typescript
interface EntradaLibroOro {
  id: string;
  titulo: string;
  descripcion: string;
  tipoEntrada: TipoEntrada;
  fechaEvento: string;
  participantes: ParticipanteHistorico[];
  ubicacion?: string;
  importanciaHistorica: number;
  evidencias: Evidencia[];
  palabrasClave: string[];
  dirigenteResponsable: Dirigente;
}

export class LibroOroService {
  static async crearEntrada(entrada: CrearEntradaData): Promise<EntradaLibroOro> {
    const response = await DatabaseFunctions.callFunction('crear_entrada_libro_oro', {
      p_titulo: entrada.titulo,
      p_descripcion: entrada.descripcion,
      p_tipo_entrada: entrada.tipoEntrada,
      p_fecha_evento: entrada.fechaEvento,
      p_participantes: entrada.participantes,
      p_dirigente_responsable_id: entrada.dirigenteResponsableId,
      p_ubicacion: entrada.ubicacion,
      p_importancia_historica: entrada.importanciaHistorica,
      p_evidencias: entrada.evidencias,
      p_palabras_clave: entrada.palabrasClave
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async buscarEntradas(filtros: FiltrosBusquedaLibroOro): Promise<EntradaLibroOro[]> {
    const response = await DatabaseFunctions.callFunction('buscar_entradas_libro_oro', {
      p_filtros: filtros,
      p_limite: filtros.limite || 50
    });
    
    return response.success ? response.data : [];
  }
  
  static async obtenerCronologia(periodo?: PeriodoHistorico): Promise<EntradaLibroOro[]> {
    const response = await DatabaseFunctions.callFunction('obtener_cronologia_historica', {
      p_fecha_desde: periodo?.fechaDesde,
      p_fecha_hasta: periodo?.fechaHasta,
      p_tipos_entrada: periodo?.tiposEntrada
    });
    
    return response.success ? response.data : [];
  }
  
  static async obtenerHallOfFame(categoria?: string): Promise<HallOfFameEntry[]> {
    const response = await DatabaseFunctions.callFunction('generar_hall_of_fame', {
      p_categoria: categoria || 'TODOS'
    });
    
    return response.success ? response.data : [];
  }
}
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Documentar Evento Histórico:**
```sql
-- 1. Crear entrada principal
SELECT crear_entrada_libro_oro(
  'Celebración 25° Aniversario',
  'Celebración del 25° aniversario del grupo con la presencia de fundadores',
  'ANIVERSARIO',
  '2024-11-30'
);

-- 2. Agregar evidencias
SELECT agregar_evidencia_entrada(entrada_id, 'FOTOGRAFIA', 'foto_oficial.jpg');
SELECT agregar_evidencia_entrada(entrada_id, 'VIDEO', 'ceremonia_aniversario.mp4');

-- 3. Registrar reconocimientos especiales
SELECT registrar_reconocimiento_especial(
  scout_id, 'SERVICIO_DISTINGUIDO', 'Por 25 años de servicio al grupo'
);
```

### **2. Consulta Histórica:**
```sql
-- Buscar eventos de campamentos
SELECT buscar_entradas_libro_oro('{
  "tipo_entrada": "CAMPAMENTO_HISTORICO",
  "fecha_desde": "2020-01-01",
  "importancia_minima": 6
}'::json);

-- Obtener cronología de la patrulla
SELECT obtener_cronologia_historica(
  '2020-01-01', '2024-12-31', '["LOGRO_GRUPAL", "RECONOCIMIENTO"]'::json
);

-- Generar hall of fame
SELECT generar_hall_of_fame('CAMPISMO', 20);
```

### **3. Reporte Anual:**
```sql
-- Generar resumen del año
SELECT generar_resumen_anual_libro_oro(2024);

-- Estadísticas generales
SELECT obtener_estadisticas_libro_oro();

-- Álbum fotográfico del año
SELECT generar_album_fotografico('2024-01-01', '2024-12-31');
```

---

## 📚 **Características Especiales**

### **Preservación Digital:**
- 📸 **Backup automático** de evidencias
- 🔒 **Inmutabilidad** de registros históricos
- 📱 **Acceso multiplataforma** para consulta
- 🔍 **Búsqueda avanzada** con IA semántica

### **Generación de Contenido:**
- 📖 **Anuarios automáticos** generados
- 🎬 **Videos conmemorativos** con evidencias
- 📊 **Infografías históricas** del grupo
- 🏆 **Certificados de reconocimiento** personalizados

### **Integración Social:**
- 📱 **Compartir en redes sociales** momentos especiales
- 👨‍👩‍👧‍👦 **Acceso de padres** a historia de sus hijos
- 🎓 **Portfolio individual** de cada scout
- 📧 **Newsletters** con momentos históricos

---

**📈 Total: 15 funciones implementadas para preservación histórica completa**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**