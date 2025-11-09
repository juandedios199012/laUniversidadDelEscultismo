// ================================================================
// 🔌 Interface: Document Engine
// ================================================================

import { DocumentTemplate } from '../../domain/entities/DocumentTemplate';
import { DocumentData } from '../../domain/entities/DocumentData';
import { Result } from '../../domain/entities/Common';

export interface DocumentGenerationOptions {
  format: 'docx' | 'pdf';
  includeSignatures?: boolean;
  customSettings?: Record<string, any>;
}

export interface IDocumentEngine {
  generateDocument(
    template: DocumentTemplate,
    data: DocumentData,
    options: DocumentGenerationOptions
  ): Promise<Result<Buffer>>;

  validateTemplate(template: DocumentTemplate): Promise<Result<boolean>>;
  
  getSupportedFormats(): string[];
  
  getEngineInfo(): {
    name: string;
    version: string;
    supportedTemplateTypes: string[];
  };
}