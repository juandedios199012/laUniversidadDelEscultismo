// ================================================================
// 🚀 Utilidades para Generación Masiva de Documentos
// ================================================================

export interface BulkGenerationOptions {
  batchSize?: number;
  maxConcurrent?: number;
  progressCallback?: (progress: number, current: string) => void;
}

export class BulkDocumentUtils {
  /**
   * Procesa documentos en lotes para optimizar memoria y rendimiento
   */
  static async processBulkDocuments<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<any>,
    options: BulkGenerationOptions = {}
  ): Promise<any[]> {
    const {
      batchSize = this.getOptimalBatchSize(items.length),
      maxConcurrent = this.getOptimalConcurrency(),
      progressCallback
    } = options;

    const results: any[] = [];
    
    // Procesar en lotes
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map((item, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        if (progressCallback) {
          progressCallback(globalIndex, this.getItemIdentifier(item));
        }
        
        return processor(item, globalIndex);
      });

      // Limitar concurrencia
      const batchResults = await this.processConcurrent(batchPromises, maxConcurrent);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes para evitar sobrecarga
      if (i + batchSize < items.length) {
        await this.sleep(50);
      }
    }
    
    return results;
  }

  /**
   * Calcula el tamaño de lote óptimo basado en la cantidad total
   */
  static getOptimalBatchSize(totalItems: number): number {
    if (totalItems <= 20) return 5;
    if (totalItems <= 50) return 10;
    if (totalItems <= 100) return 15;
    if (totalItems <= 500) return 25;
    return 50; // Para cantidades muy grandes
  }

  /**
   * Determina la concurrencia óptima basada en el navegador
   */
  private static getOptimalConcurrency(): number {
    // Detectar capacidades del navegador
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    return Math.min(Math.max(hardwareConcurrency - 1, 2), 8);
  }

  /**
   * Procesa promesas con límite de concurrencia
   */
  private static async processConcurrent<T>(
    promises: Promise<T>[],
    maxConcurrent: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += maxConcurrent) {
      const batch = promises.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Obtiene un identificador legible del item para mostrar progreso
   */
  private static getItemIdentifier(item: any): string {
    if (item.nombres && item.apellidos) {
      return `${item.nombres} ${item.apellidos}`;
    }
    if (item.name) return item.name;
    if (item.id) return `ID: ${item.id}`;
    return 'Procesando...';
  }

  /**
   * Pausa asíncrona
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estima el tiempo de generación basado en cantidad y complejidad
   */
  static estimateGenerationTime(itemCount: number, complexityFactor: number = 1): number {
    // Tiempo base por documento en segundos
    const baseTimePerDoc = 0.5 * complexityFactor;
    
    // Factores de optimización para grandes cantidades
    let optimizationFactor = 1;
    if (itemCount > 100) optimizationFactor = 0.7;
    if (itemCount > 500) optimizationFactor = 0.5;
    if (itemCount > 1000) optimizationFactor = 0.3;
    
    return Math.ceil(itemCount * baseTimePerDoc * optimizationFactor);
  }

  /**
   * Formatea el tiempo estimado en formato legible
   */
  static formatEstimatedTime(seconds: number): string {
    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutos`;
    return `${Math.ceil(seconds / 3600)} horas`;
  }

  /**
   * Genera sugerencias de optimización basadas en la cantidad
   */
  static getOptimizationSuggestions(itemCount: number): string[] {
    const suggestions: string[] = [];
    
    if (itemCount > 50) {
      suggestions.push("💡 Considera generar durante horarios de menor actividad del sistema");
    }
    
    if (itemCount > 100) {
      suggestions.push("🔄 El proceso se ejecutará en lotes optimizados automáticamente");
      suggestions.push("📱 Mantén la pestaña activa durante la generación");
    }
    
    if (itemCount > 500) {
      suggestions.push("⚡ Se aplicará procesamiento de alta velocidad para grandes volúmenes");
      suggestions.push("💾 Asegúrate de tener suficiente espacio en disco");
    }
    
    if (itemCount > 1000) {
      suggestions.push("🏗️ Generación empresarial activada - Máximo rendimiento");
      suggestions.push("☕ Tiempo estimado considerable - Prepara un café");
    }
    
    return suggestions;
  }
}

export default BulkDocumentUtils;