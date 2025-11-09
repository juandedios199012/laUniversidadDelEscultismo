/**
 * Document Generation Strategy Pattern Implementation
 * Follows Strategy Pattern and Open/Closed Principle
 * Allows easy switching between different document formats
 */

import { ITemplateConfig, DNGI03TemplateConfig } from '../config/TemplateConfig';

// Common Scout interface for all generators
export interface Scout {
  id?: string;
  apellidos?: string;
  nombres?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  unidad?: string;
  direccion?: string;
  codigo_postal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  correo_institucional?: string;
  correo_personal?: string;
  celular?: string;
  telefono?: string;
  religion?: string;
  centro_estudios?: string;
  año_estudios?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  observaciones_discapacidad?: string;
}

// Strategy interface
export interface IDocumentGenerationStrategy {
  generateDocument(scout: Scout): Promise<Uint8Array>;
  getFileExtension(): string;
  getMimeType(): string;
  getFormatName(): string;
}

// Context class that uses strategies
export class DocumentGenerator {
  private strategy: IDocumentGenerationStrategy;
  private config: ITemplateConfig;

  constructor(strategy: IDocumentGenerationStrategy, config?: ITemplateConfig) {
    this.strategy = strategy;
    this.config = config || new DNGI03TemplateConfig();
  }

  public setStrategy(strategy: IDocumentGenerationStrategy): void {
    this.strategy = strategy;
  }

  public async generateDocument(scout: Scout): Promise<{
    data: Uint8Array;
    filename: string;
    mimeType: string;
    format: string;
  }> {
    const data = await this.strategy.generateDocument(scout);
    const scoutName = `${scout.apellidos || 'Scout'}_${scout.nombres || 'Unknown'}`.replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    return {
      data,
      filename: `DNGI-03_${scoutName}_${timestamp}.${this.strategy.getFileExtension()}`,
      mimeType: this.strategy.getMimeType(),
      format: this.strategy.getFormatName()
    };
  }

  public getConfig(): ITemplateConfig {
    return this.config;
  }

  public setConfig(config: ITemplateConfig): void {
    this.config = config;
  }
}

// Word Strategy
export class WordGenerationStrategy implements IDocumentGenerationStrategy {
  private config: ITemplateConfig;

  constructor(config?: ITemplateConfig) {
    this.config = config || new DNGI03TemplateConfig();
  }

  async generateDocument(scout: Scout): Promise<Uint8Array> {
    // Dynamic import to avoid bundle size issues
    const { EnhancedWordGenerator } = await import('./EnhancedWordGenerator');
    const generator = new EnhancedWordGenerator(this.config);
    const buffer = await generator.generateDocument(scout);
    return new Uint8Array(buffer);
  }

  getFileExtension(): string {
    return 'docx';
  }

  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  getFormatName(): string {
    return 'Word Document';
  }
}

// PDF Strategy
export class PDFGenerationStrategy implements IDocumentGenerationStrategy {
  private config: ITemplateConfig;

  constructor(config?: ITemplateConfig) {
    this.config = config || new DNGI03TemplateConfig();
  }

  async generateDocument(scout: Scout): Promise<Uint8Array> {
    // Dynamic import to avoid bundle size issues
    const { EnhancedPDFGenerator } = await import('./EnhancedPDFGenerator');
    const generator = new EnhancedPDFGenerator(this.config);
    return await generator.generatePDF(scout);
  }

  getFileExtension(): string {
    return 'pdf';
  }

  getMimeType(): string {
    return 'application/pdf';
  }

  getFormatName(): string {
    return 'PDF Document';
  }
}

// HTML Strategy
export class HTMLGenerationStrategy implements IDocumentGenerationStrategy {
  constructor(_config?: ITemplateConfig) {
    // HTML generation doesn't use config currently, but we keep it for consistency
  }

  async generateDocument(scout: Scout): Promise<Uint8Array> {
    // Dynamic import to avoid bundle size issues
    const { HTMLTemplateGenerator } = await import('./HTMLTemplateGenerator');
    
    // Convert Scout to HTMLTemplateData
    const templateData = {
      apellidos: scout.apellidos || '',
      nombres: scout.nombres || '',
      sexo: scout.sexo || '',
      fecha_nacimiento: scout.fecha_nacimiento || '',
      tipo_documento: scout.tipo_documento || 'DNI',
      numero_documento: scout.numero_documento || '',
      region: 'XVIII',
      localidad: 'LIMA',
      numeral: '12',
      unidad: scout.unidad || 'TROPA',
      direccion: scout.direccion || '',
      codigo_postal: scout.codigo_postal || '',
      departamento: scout.departamento || 'LIMA',
      provincia: scout.provincia || 'LIMA',
      distrito: scout.distrito || '',
      correo_institucional: scout.correo_institucional || '',
      correo_personal: scout.correo_personal || '',
      celular: scout.celular || '',
      telefono: scout.telefono || '',
      religion: scout.religion || '',
      centro_estudios: scout.centro_estudios || '',
      ano_estudios: scout.año_estudios || '',
      grupo_sanguineo: scout.grupo_sanguineo || '',
      factor_sanguineo: scout.factor_sanguineo || '',
      seguro_medico: scout.seguro_medico || '',
      tipo_discapacidad: scout.tipo_discapacidad || 'NINGUNA',
      carne_conadis: 'NO APLICA',
      especificar_discapacidad: scout.observaciones_discapacidad || 'NO APLICA',
      fecha_actual: new Date().toLocaleDateString('es-PE')
    };
    
    const htmlContent = HTMLTemplateGenerator.generateHTML(templateData);
    return new TextEncoder().encode(htmlContent);
  }

  getFileExtension(): string {
    return 'html';
  }

  getMimeType(): string {
    return 'text/html';
  }

  getFormatName(): string {
    return 'HTML Document';
  }
}

// Factory for creating strategies
export class DocumentGenerationStrategyFactory {
  static createWordStrategy(config?: ITemplateConfig): WordGenerationStrategy {
    return new WordGenerationStrategy(config);
  }

  static createPDFStrategy(config?: ITemplateConfig): PDFGenerationStrategy {
    return new PDFGenerationStrategy(config);
  }

  static createHTMLStrategy(config?: ITemplateConfig): HTMLGenerationStrategy {
    return new HTMLGenerationStrategy(config);
  }

  static createStrategy(format: 'word' | 'pdf' | 'html', config?: ITemplateConfig): IDocumentGenerationStrategy {
    switch (format.toLowerCase()) {
      case 'word':
        return this.createWordStrategy(config);
      case 'pdf':
        return this.createPDFStrategy(config);
      case 'html':
        return this.createHTMLStrategy(config);
      default:
        throw new Error(`Unsupported document format: ${format}`);
    }
  }
}

// Utility class for bulk generation
export class BulkDocumentGenerationUtils {
  private generator: DocumentGenerator;

  constructor(strategy: IDocumentGenerationStrategy, config?: ITemplateConfig) {
    this.generator = new DocumentGenerator(strategy, config);
  }

  public async generateBulkDocuments(
    scouts: Scout[],
    progressCallback?: (progress: number, scoutName: string) => void
  ): Promise<{ documents: Array<{ scout: Scout; document: Uint8Array; filename: string; mimeType: string; }>, errors: Array<{ scout: Scout; error: string; }> }> {
    const documents: Array<{ scout: Scout; document: Uint8Array; filename: string; mimeType: string; }> = [];
    const errors: Array<{ scout: Scout; error: string; }> = [];

    for (let i = 0; i < scouts.length; i++) {
      const scout = scouts[i];
      const scoutName = `${scout.apellidos || ''} ${scout.nombres || ''}`.trim();
      
      try {
        if (progressCallback) {
          progressCallback(Math.round((i / scouts.length) * 100), scoutName);
        }

        const result = await this.generator.generateDocument(scout);
        documents.push({
          scout,
          document: result.data,
          filename: result.filename,
          mimeType: result.mimeType
        });
      } catch (error) {
        errors.push({
          scout,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    if (progressCallback) {
      progressCallback(100, 'Completado');
    }

    return { documents, errors };
  }

  public setStrategy(strategy: IDocumentGenerationStrategy): void {
    this.generator.setStrategy(strategy);
  }

  public setConfig(config: ITemplateConfig): void {
    this.generator.setConfig(config);
  }
}

// Export types and utilities
export type DocumentFormat = 'word' | 'pdf' | 'html';

export interface DocumentGenerationResult {
  data: Uint8Array;
  filename: string;
  mimeType: string;
  format: string;
}

export interface BulkGenerationProgress {
  completed: number;
  total: number;
  percentage: number;
  currentScout: string;
}

export interface BulkGenerationResult {
  documents: Array<{
    scout: Scout;
    document: Uint8Array;
    filename: string;
    mimeType: string;
  }>;
  errors: Array<{
    scout: Scout;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}