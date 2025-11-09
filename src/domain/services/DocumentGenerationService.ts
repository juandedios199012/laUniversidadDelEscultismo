// ================================================================
// 🔧 Domain Service: Document Generation
// ================================================================

import { DocumentTemplate } from '../entities/DocumentTemplate';
import { DocumentData } from '../entities/DocumentData';

export interface DocumentGenerationService {
  generateDocument(
    template: DocumentTemplate,
    data: DocumentData,
    format: 'docx' | 'pdf'
  ): Promise<Buffer>;
}

export interface DocumentEngine {
  supports(format: string): boolean;
  generate(template: DocumentTemplate, data: DocumentData): Promise<Buffer>;
}

// ================================================================
// 📊 Document Generation Strategy
// ================================================================

export class DocumentGenerationServiceImpl implements DocumentGenerationService {
  private engines: Map<string, DocumentEngine> = new Map();

  constructor(engines: DocumentEngine[]) {
    engines.forEach(engine => {
      // Registrar engines por formato soportado
      if (engine.supports('docx')) this.engines.set('docx', engine);
      if (engine.supports('pdf')) this.engines.set('pdf', engine);
    });
  }

  async generateDocument(
    template: DocumentTemplate,
    data: DocumentData,
    format: 'docx' | 'pdf'
  ): Promise<Buffer> {
    const engine = this.engines.get(format);
    if (!engine) {
      throw new Error(`No engine available for format: ${format}`);
    }

    try {
      return await engine.generate(template, data);
    } catch (error) {
      throw new Error(`Document generation failed: ${error.message}`);
    }
  }
}