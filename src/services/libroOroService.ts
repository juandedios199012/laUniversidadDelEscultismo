import { supabase } from '../lib/supabase';

/**
 * ======================================================================
 * 📖 LIBRO ORO SERVICE - CLIENTE DE MICROSERVICIO/API
 * ======================================================================
 * 
 * Este servicio actúa como un cliente puro de microservicio/API.
 * TODA la lógica de negocio reside en el backend (Supabase Database Functions).
 * ======================================================================
 */
export class LibroOroService {

  // ============= 📖 GESTIÓN DE REGISTROS =============
  
  /**
   * 📝 Crear nuevo registro en el libro de oro
   * Endpoint: POST /api/libro-oro/registros
   */
  static async crearRegistro(registro: {
    fecha: string;
    tipo: 'logro' | 'reconocimiento' | 'evento' | 'aniversario' | 'memorial';
    titulo: string;
    descripcion: string;
    participantes: Array<{
      scout_id?: string;
      dirigente_id?: string;
      nombre_completo?: string;
      rol: string;
    }>;
    categoria: string;
    importancia: 'alta' | 'media' | 'baja';
    lugar?: string;
    fotos?: string[];
    documentos?: string[];
    testigos?: string[];
    observaciones?: string;
  }): Promise<{ success: boolean; registro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_registro_libro_oro', {
          p_fecha: registro.fecha,
          p_tipo: registro.tipo,
          p_titulo: registro.titulo,
          p_descripcion: registro.descripcion,
          p_participantes: registro.participantes,
          p_categoria: registro.categoria,
          p_importancia: registro.importancia,
          p_lugar: registro.lugar,
          p_fotos: registro.fotos || [],
          p_documentos: registro.documentos || [],
          p_testigos: registro.testigos || [],
          p_observaciones: registro.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear registro:', error);
      throw error;
    }
  }

  /**
   * 📋 Obtener registros del libro de oro
   * Endpoint: GET /api/libro-oro/registros
   */
  static async getRegistros(filtros?: {
    año?: number;
    tipo?: string;
    categoria?: string;
    importancia?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    participante_id?: string;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_registros_libro_oro', { p_filtros: filtros || {} });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener registros:', error);
      throw error;
    }
  }

  /**
   * 🎯 Obtener registro por ID
   * Endpoint: GET /api/libro-oro/registros/{id}
   */
  static async getRegistroById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_registro_libro_oro_por_id', { p_registro_id: id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener registro:', error);
      throw error;
    }
  }

  // ============= 🏆 LOGROS Y RECONOCIMIENTOS =============
  
  /**
   * 🏆 Registrar logro destacado
   * Endpoint: POST /api/libro-oro/logros
   */
  static async registrarLogro(logro: {
    scout_id?: string;
    dirigente_id?: string;
    tipo_logro: string;
    descripcion_logro: string;
    fecha_logro: string;
    nivel_reconocimiento: 'grupo' | 'distrito' | 'regional' | 'nacional' | 'internacional';
    institucion_otorgante?: string;
    certificado?: string;
    impacto_comunidad?: string;
    mentores?: string[];
    observaciones?: string;
  }): Promise<{ success: boolean; logro_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_logro_destacado', {
          p_scout_id: logro.scout_id,
          p_dirigente_id: logro.dirigente_id,
          p_tipo_logro: logro.tipo_logro,
          p_descripcion_logro: logro.descripcion_logro,
          p_fecha_logro: logro.fecha_logro,
          p_nivel_reconocimiento: logro.nivel_reconocimiento,
          p_institucion_otorgante: logro.institucion_otorgante,
          p_certificado: logro.certificado,
          p_impacto_comunidad: logro.impacto_comunidad,
          p_mentores: logro.mentores || [],
          p_observaciones: logro.observaciones
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar logro:', error);
      throw error;
    }
  }

  /**
   * 🌟 Registrar evento histórico
   * Endpoint: POST /api/libro-oro/eventos-historicos
   */
  static async registrarEventoHistorico(evento: {
    fecha: string;
    titulo: string;
    descripcion: string;
    tipo_evento: 'fundacion' | 'aniversario' | 'logro_grupal' | 'visita_importante' | 'proyecto_comunitario';
    participantes_destacados: string[];
    impacto_historico: string;
    documentos_historicos?: string[];
    testimonios?: Array<{
      autor: string;
      contenido: string;
      fecha_testimonio?: string;
    }>;
    lugar_eventos?: string;
    cronologia?: Array<{
      momento: string;
      descripcion: string;
    }>;
  }): Promise<{ success: boolean; evento_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_evento_historico', {
          p_fecha: evento.fecha,
          p_titulo: evento.titulo,
          p_descripcion: evento.descripcion,
          p_tipo_evento: evento.tipo_evento,
          p_participantes_destacados: evento.participantes_destacados,
          p_impacto_historico: evento.impacto_historico,
          p_documentos_historicos: evento.documentos_historicos || [],
          p_testimonios: evento.testimonios || [],
          p_lugar_eventos: evento.lugar_eventos,
          p_cronologia: evento.cronologia || []
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar evento histórico:', error);
      throw error;
    }
  }

  // ============= 📊 MEMORIALES Y HOMENAJES =============
  
  /**
   * 🕯️ Crear memorial
   * Endpoint: POST /api/libro-oro/memoriales
   */
  static async crearMemorial(memorial: {
    persona_homenajeada: string;
    fecha_nacimiento?: string;
    fecha_fallecimiento?: string;
    biografia: string;
    contribuciones: string[];
    anecdotas?: string[];
    fotos_memorial?: string[];
    mensajes_despedida?: Array<{
      autor: string;
      mensaje: string;
      relacion: string;
    }>;
    legado: string;
    ceremonias_homenaje?: Array<{
      fecha: string;
      tipo: string;
      descripcion: string;
    }>;
  }): Promise<{ success: boolean; memorial_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_memorial_libro_oro', {
          p_persona_homenajeada: memorial.persona_homenajeada,
          p_fecha_nacimiento: memorial.fecha_nacimiento,
          p_fecha_fallecimiento: memorial.fecha_fallecimiento,
          p_biografia: memorial.biografia,
          p_contribuciones: memorial.contribuciones,
          p_anecdotas: memorial.anecdotas || [],
          p_fotos_memorial: memorial.fotos_memorial || [],
          p_mensajes_despedida: memorial.mensajes_despedida || [],
          p_legado: memorial.legado,
          p_ceremonias_homenaje: memorial.ceremonias_homenaje || []
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear memorial:', error);
      throw error;
    }
  }

  // ============= 📅 EFEMÉRIDES Y ANIVERSARIOS =============
  
  /**
   * 📅 Registrar efeméride
   * Endpoint: POST /api/libro-oro/efemerides
   */
  static async registrarEfemeride(efemeride: {
    fecha_aniversario: string;
    titulo: string;
    descripcion: string;
    tipo: 'fundacion_grupo' | 'primera_rama' | 'primer_campamento' | 'reconocimiento_importante' | 'otro';
    años_transcurridos?: number;
    personajes_clave?: string[];
    contexto_historico?: string;
    celebraciones_programadas?: Array<{
      año: number;
      actividades: string[];
      responsables: string[];
    }>;
    documentos_conmemorativos?: string[];
  }): Promise<{ success: boolean; efemeride_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('registrar_efemeride', {
          p_fecha_aniversario: efemeride.fecha_aniversario,
          p_titulo: efemeride.titulo,
          p_descripcion: efemeride.descripcion,
          p_tipo: efemeride.tipo,
          p_años_transcurridos: efemeride.años_transcurridos,
          p_personajes_clave: efemeride.personajes_clave || [],
          p_contexto_historico: efemeride.contexto_historico,
          p_celebraciones_programadas: efemeride.celebraciones_programadas || [],
          p_documentos_conmemorativos: efemeride.documentos_conmemorativos || []
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al registrar efeméride:', error);
      throw error;
    }
  }

  /**
   * 📅 Obtener próximas efemérides
   * Endpoint: GET /api/libro-oro/efemerides/proximas
   */
  static async getProximasEfemerides(meses_adelante: number = 12): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_proximas_efemerides', { p_meses_adelante: meses_adelante });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error al obtener próximas efemérides:', error);
      throw error;
    }
  }

  // ============= 📊 ARCHIVO Y BÚSQUEDA =============
  
  /**
   * 🔍 Búsqueda avanzada en el libro de oro
   * Endpoint: GET /api/libro-oro/buscar
   */
  static async buscarEnLibroOro(criterios: {
    termino_busqueda?: string;
    tipo_registro?: string;
    participante?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    categoria?: string;
    importancia?: string;
    incluir_archivados?: boolean;
  }): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('buscar_en_libro_oro', { p_criterios: criterios });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas del libro de oro
   * Endpoint: GET /api/libro-oro/estadisticas
   */
  static async getEstadisticasLibroOro(): Promise<{
    total_registros: number;
    registros_por_tipo: Record<string, number>;
    registros_por_año: Record<string, number>;
    participantes_mas_mencionados: Array<{
      nombre: string;
      menciones: number;
      tipo_participacion: string[];
    }>;
    categorias_mas_frecuentes: Record<string, number>;
    documentos_archivados: number;
    fotos_preservadas: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_estadisticas_libro_oro');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ============= 🗂️ REPORTES Y EXPORTACIÓN =============
  
  /**
   * 🗂️ Generar reporte cronológico
   * Endpoint: GET /api/libro-oro/reportes/cronologico
   */
  static async generarReporteCronologico(filtros: {
    año_inicio?: number;
    año_fin?: number;
    tipo_registros?: string[];
    incluir_fotos?: boolean;
    formato?: 'pdf' | 'html' | 'json';
  }): Promise<{
    reporte_id: string;
    url_descarga?: string;
    datos: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('generar_reporte_cronologico', { p_filtros: filtros });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al generar reporte cronológico:', error);
      throw error;
    }
  }

  /**
   * 📖 Exportar libro de oro completo
   * Endpoint: GET /api/libro-oro/exportar
   */
  static async exportarLibroCompleto(opciones: {
    incluir_memoriales?: boolean;
    incluir_fotos?: boolean;
    incluir_documentos?: boolean;
    formato: 'pdf' | 'epub' | 'html';
    organizacion: 'cronologico' | 'tematico' | 'por_participantes';
  }): Promise<{
    exportacion_id: string;
    url_descarga?: string;
    tamaño_archivo?: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('exportar_libro_oro_completo', { p_opciones: opciones });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al exportar libro completo:', error);
      throw error;
    }
  }

  /**
   * 📮 Crear cápsula del tiempo
   * Endpoint: POST /api/libro-oro/capsula-tiempo
   */
  static async crearCapsulaDelTiempo(capsula: {
    nombre: string;
    fecha_creacion: string;
    fecha_apertura_programada: string;
    descripcion: string;
    contenido: Array<{
      tipo: 'texto' | 'foto' | 'video' | 'documento' | 'mensaje';
      titulo: string;
      contenido: string;
      autor?: string;
    }>;
    participantes_contribuyentes: string[];
    condiciones_apertura?: string;
    mensaje_futuro?: string;
  }): Promise<{ success: boolean; capsula_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('crear_capsula_del_tiempo', {
          p_nombre: capsula.nombre,
          p_fecha_creacion: capsula.fecha_creacion,
          p_fecha_apertura_programada: capsula.fecha_apertura_programada,
          p_descripcion: capsula.descripcion,
          p_contenido: capsula.contenido,
          p_participantes_contribuyentes: capsula.participantes_contribuyentes,
          p_condiciones_apertura: capsula.condiciones_apertura,
          p_mensaje_futuro: capsula.mensaje_futuro
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al crear cápsula del tiempo:', error);
      throw error;
    }
  }
}

/**
 * ======================================================================
 * 📝 NOTAS DE IMPLEMENTACIÓN
 * ======================================================================
 * 
 * Sistema completo de preservación histórica con:
 * - Registro detallado de logros y eventos importantes
 * - Sistema de memoriales y homenajes
 * - Gestión de efemérides y aniversarios
 * - Archivo fotográfico y documental
 * - Búsqueda avanzada de registros históricos
 * - Exportación en múltiples formatos
 * - Cápsulas del tiempo para el futuro
 * ======================================================================
 */

export default LibroOroService;