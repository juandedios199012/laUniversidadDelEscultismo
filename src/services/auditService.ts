import { supabase } from '../lib/supabase';
import { Modulo, Accion } from './permissionsService';

// ================================================================
// TIPOS
// ================================================================

export interface RegistroAuditoria {
  id: string;
  user_id: string;
  user_email: string;
  user_nombre: string;
  user_rol: string;
  modulo: Modulo;
  accion: Accion;
  tabla_afectada: string;
  registro_id: string;
  descripcion: string;
  cambios: Record<string, { antes: unknown; despues: unknown }> | null;
  dispositivo: 'web' | 'mobile' | 'api';
  fecha_hora: string;
}

export interface FiltrosAuditoria {
  user_id?: string;
  modulo?: Modulo;
  accion?: Accion;
  fecha_desde?: string;
  fecha_hasta?: string;
  registro_id?: string;
  limit?: number;
  offset?: number;
}

export interface ResultadoAuditoria {
  total: number;
  registros: RegistroAuditoria[];
}

export interface DatosAuditoria {
  modulo: Modulo;
  accion: Accion;
  tabla: string;
  registroId?: string;
  descripcion: string;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  dispositivo?: 'web' | 'mobile' | 'api';
}

// ================================================================
// SERVICIO DE AUDITORÍA
// ================================================================

export class AuditService {
  
  // Detectar dispositivo automáticamente
  private static detectarDispositivo(): 'web' | 'mobile' | 'api' {
    if (typeof window === 'undefined') return 'api';
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    
    return isMobile ? 'mobile' : 'web';
  }

  /**
   * Registrar una acción en el log de auditoría
   */
  static async registrar(
    userId: string,
    datos: DatosAuditoria
  ): Promise<{ success: boolean; auditId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('registrar_auditoria', {
        p_user_id: userId,
        p_modulo: datos.modulo,
        p_accion: datos.accion,
        p_tabla: datos.tabla,
        p_registro_id: datos.registroId || null,
        p_descripcion: datos.descripcion,
        p_datos_anteriores: datos.datosAnteriores || null,
        p_datos_nuevos: datos.datosNuevos || null,
        p_dispositivo: datos.dispositivo || this.detectarDispositivo()
      });

      if (error) {
        console.error('❌ Error registrando auditoría:', error);
        return { success: false, error: error.message };
      }

      return { success: true, auditId: data };
    } catch (error) {
      console.error('❌ Error en registrar auditoría:', error);
      return { success: false, error: 'Error al registrar auditoría' };
    }
  }

  /**
   * Registrar creación de un registro
   */
  static async registrarCreacion(
    userId: string,
    modulo: Modulo,
    tabla: string,
    registroId: string,
    descripcion: string,
    datosNuevos?: Record<string, unknown>
  ): Promise<void> {
    await this.registrar(userId, {
      modulo,
      accion: 'crear',
      tabla,
      registroId,
      descripcion,
      datosNuevos
    });
  }

  /**
   * Registrar edición de un registro
   */
  static async registrarEdicion(
    userId: string,
    modulo: Modulo,
    tabla: string,
    registroId: string,
    descripcion: string,
    datosAnteriores?: Record<string, unknown>,
    datosNuevos?: Record<string, unknown>
  ): Promise<void> {
    await this.registrar(userId, {
      modulo,
      accion: 'editar',
      tabla,
      registroId,
      descripcion,
      datosAnteriores,
      datosNuevos
    });
  }

  /**
   * Registrar eliminación de un registro
   */
  static async registrarEliminacion(
    userId: string,
    modulo: Modulo,
    tabla: string,
    registroId: string,
    descripcion: string,
    datosAnteriores?: Record<string, unknown>
  ): Promise<void> {
    await this.registrar(userId, {
      modulo,
      accion: 'eliminar',
      tabla,
      registroId,
      descripcion,
      datosAnteriores
    });
  }

  /**
   * Registrar consulta/lectura (opcional, para recursos sensibles)
   */
  static async registrarLectura(
    userId: string,
    modulo: Modulo,
    descripcion: string
  ): Promise<void> {
    await this.registrar(userId, {
      modulo,
      accion: 'leer',
      tabla: '',
      descripcion
    });
  }

  /**
   * Registrar exportación de datos
   */
  static async registrarExportacion(
    userId: string,
    modulo: Modulo,
    descripcion: string,
    cantidadRegistros?: number
  ): Promise<void> {
    await this.registrar(userId, {
      modulo,
      accion: 'exportar',
      tabla: '',
      descripcion: `${descripcion}${cantidadRegistros ? ` (${cantidadRegistros} registros)` : ''}`
    });
  }

  /**
   * Consultar registros de auditoría con filtros
   */
  static async consultar(filtros: FiltrosAuditoria = {}): Promise<ResultadoAuditoria> {
    try {
      const { data, error } = await supabase.rpc('consultar_auditoria', {
        p_filtros: filtros
      });

      if (error) {
        console.error('❌ Error consultando auditoría:', error);
        return { total: 0, registros: [] };
      }

      return {
        total: data?.total || 0,
        registros: data?.registros || []
      };
    } catch (error) {
      console.error('❌ Error en consultar auditoría:', error);
      return { total: 0, registros: [] };
    }
  }

  /**
   * Obtener historial de un registro específico
   */
  static async obtenerHistorialRegistro(registroId: string): Promise<RegistroAuditoria[]> {
    const resultado = await this.consultar({
      registro_id: registroId,
      limit: 100
    });
    return resultado.registros;
  }

  /**
   * Obtener actividad reciente de un usuario
   */
  static async obtenerActividadUsuario(
    userId: string, 
    limite: number = 20
  ): Promise<RegistroAuditoria[]> {
    const resultado = await this.consultar({
      user_id: userId,
      limit: limite
    });
    return resultado.registros;
  }

  /**
   * Obtener actividad reciente del sistema (para dashboard)
   */
  static async obtenerActividadReciente(limite: number = 20): Promise<RegistroAuditoria[]> {
    const resultado = await this.consultar({ limit: limite });
    return resultado.registros;
  }

  /**
   * Obtener estadísticas de auditoría por módulo
   */
  static async obtenerEstadisticasPorModulo(
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<Record<Modulo, number>> {
    try {
      // Consulta básica, agrupa manualmente
      const resultado = await this.consultar({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        limit: 1000
      });

      const estadisticas: Record<string, number> = {};
      
      for (const registro of resultado.registros) {
        estadisticas[registro.modulo] = (estadisticas[registro.modulo] || 0) + 1;
      }

      return estadisticas as Record<Modulo, number>;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {} as Record<Modulo, number>;
    }
  }

  /**
   * Obtener usuarios más activos
   */
  static async obtenerUsuariosMasActivos(
    limite: number = 10,
    fechaDesde?: string
  ): Promise<Array<{ user_id: string; user_nombre: string; acciones: number }>> {
    try {
      const resultado = await this.consultar({
        fecha_desde: fechaDesde,
        limit: 1000
      });

      const conteo: Record<string, { nombre: string; acciones: number }> = {};
      
      for (const registro of resultado.registros) {
        if (!conteo[registro.user_id]) {
          conteo[registro.user_id] = {
            nombre: registro.user_nombre,
            acciones: 0
          };
        }
        conteo[registro.user_id].acciones++;
      }

      return Object.entries(conteo)
        .map(([user_id, data]) => ({
          user_id,
          user_nombre: data.nombre,
          acciones: data.acciones
        }))
        .sort((a, b) => b.acciones - a.acciones)
        .slice(0, limite);
    } catch (error) {
      console.error('❌ Error obteniendo usuarios activos:', error);
      return [];
    }
  }
}

export default AuditService;
