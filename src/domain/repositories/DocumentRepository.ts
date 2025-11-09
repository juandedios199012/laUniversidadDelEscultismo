// ================================================================
// 📄 Repository Interface: Document Management
// ================================================================

import { DocumentTemplate, DocumentType } from '../entities/DocumentTemplate';
import { DocumentData } from '../entities/DocumentData';

export interface DocumentRepository {
  // Template Management
  getTemplateById(id: string): Promise<DocumentTemplate | null>;
  getTemplatesByType(type: DocumentType): Promise<DocumentTemplate[]>;
  getAllTemplates(): Promise<DocumentTemplate[]>;
  saveTemplate(template: DocumentTemplate): Promise<DocumentTemplate>;
  updateTemplate(id: string, template: Partial<DocumentTemplate>): Promise<DocumentTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // Template Versioning
  getTemplateVersions(templateId: string): Promise<DocumentTemplate[]>;
  getLatestTemplateVersion(templateId: string): Promise<DocumentTemplate | null>;
  createTemplateVersion(templateId: string, template: DocumentTemplate): Promise<DocumentTemplate>;
  
  // Template Search and Filter
  searchTemplates(query: string): Promise<DocumentTemplate[]>;
  getTemplatesByCategory(category: string): Promise<DocumentTemplate[]>;
  getTemplatesByPermission(userId: string, permission: 'view' | 'edit' | 'generate'): Promise<DocumentTemplate[]>;
}

export interface DocumentGenerationRepository {
  // Document Generation History
  saveGenerationRecord(record: DocumentGenerationRecord): Promise<string>;
  getGenerationHistory(userId?: string, templateId?: string): Promise<DocumentGenerationRecord[]>;
  getGenerationRecord(id: string): Promise<DocumentGenerationRecord | null>;
  
  // Generated Document Storage
  storeGeneratedDocument(documentId: string, buffer: Buffer, metadata: DocumentStorageMetadata): Promise<string>;
  getGeneratedDocument(documentId: string): Promise<Buffer | null>;
  deleteGeneratedDocument(documentId: string): Promise<boolean>;
  
  // Document Analytics
  getGenerationStats(templateId?: string): Promise<DocumentGenerationStats>;
}

export interface DocumentGenerationRecord {
  id: string;
  templateId: string;
  templateVersion: string;
  userId: string;
  generatedAt: Date;
  purpose: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  fileUrl?: string;
  metadata: Record<string, any>;
}

export interface DocumentStorageMetadata {
  filename: string;
  mimeType: string;
  size: number;
  checksum: string;
  expiresAt?: Date;
  isPublic: boolean;
}

export interface DocumentGenerationStats {
  totalGenerations: number;
  generationsByType: Record<DocumentType, number>;
  generationsByMonth: Array<{
    month: string;
    count: number;
  }>;
  mostUsedTemplates: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  averageGenerationTime: number;
  successRate: number;
}