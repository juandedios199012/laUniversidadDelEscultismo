// ================================================================
// 🎯 Use Case: Generate Document
// ================================================================

import { DocumentTemplate } from '../../domain/entities/DocumentTemplate';
import { DocumentData } from '../../domain/entities/DocumentData';
import { DocumentRepository, DocumentGenerationRepository } from '../../domain/repositories/DocumentRepository';
import { DocumentGenerationService } from '../../domain/services/DocumentGenerationService';
import { DocumentDataMapper } from '../mappers/DocumentDataMapper';
import { Logger } from '../../infrastructure/logging/Logger';

export interface GenerateDocumentCommand {
  templateId: string;
  scoutId?: string;
  groupId?: string;
  activityId?: string;
  customData?: Record<string, any>;
  format: 'docx' | 'pdf';
  userId: string;
  purpose: string;
}

export interface GenerateDocumentResult {
  success: boolean;
  documentId?: string;
  fileUrl?: string;
  fileName?: string;
  error?: string;
  generationTime?: number;
}

export class GenerateDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private generationRepository: DocumentGenerationRepository,
    private generationService: DocumentGenerationService,
    private dataMapper: DocumentDataMapper,
    private logger: Logger
  ) {}

  async execute(command: GenerateDocumentCommand): Promise<GenerateDocumentResult> {
    const startTime = Date.now();
    const generationId = this.generateUniqueId();
    
    try {
      this.logger.info('Starting document generation', { 
        generationId, 
        templateId: command.templateId,
        userId: command.userId 
      });

      // 1. Validar permisos
      await this.validatePermissions(command.templateId, command.userId);

      // 2. Obtener template
      const template = await this.documentRepository.getTemplateById(command.templateId);
      if (!template) {
        throw new Error(`Template not found: ${command.templateId}`);
      }

      // 3. Recopilar y mapear datos
      const documentData = await this.gatherDocumentData(command);

      // 4. Validar datos requeridos
      await this.validateRequiredData(template, documentData);

      // 5. Generar documento
      const generatedDocument = await this.generationService.generateDocument(
        template,
        documentData,
        command.format
      );

      // 6. Almacenar documento generado
      const fileName = this.generateFileName(template, documentData, command.format);
      const fileUrl = await this.generationRepository.storeGeneratedDocument(
        generationId,
        generatedDocument,
        {
          filename: fileName,
          mimeType: this.getMimeType(command.format),
          size: generatedDocument.length,
          checksum: this.calculateChecksum(generatedDocument),
          isPublic: false
        }
      );

      // 7. Registrar generación exitosa
      await this.generationRepository.saveGenerationRecord({
        id: generationId,
        templateId: command.templateId,
        templateVersion: template.version,
        userId: command.userId,
        generatedAt: new Date(),
        purpose: command.purpose,
        status: 'completed',
        fileUrl,
        metadata: {
          format: command.format,
          scoutId: command.scoutId,
          groupId: command.groupId,
          activityId: command.activityId
        }
      });

      const generationTime = Date.now() - startTime;
      
      this.logger.info('Document generation completed successfully', {
        generationId,
        generationTime,
        fileName
      });

      return {
        success: true,
        documentId: generationId,
        fileUrl,
        fileName,
        generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('Document generation failed', {
        generationId,
        error: errorMessage,
        generationTime
      });

      // Registrar generación fallida
      await this.generationRepository.saveGenerationRecord({
        id: generationId,
        templateId: command.templateId,
        templateVersion: '1.0',
        userId: command.userId,
        generatedAt: new Date(),
        purpose: command.purpose,
        status: 'failed',
        errorMessage,
        metadata: {
          format: command.format,
          generationTime
        }
      });

      return {
        success: false,
        error: errorMessage,
        generationTime
      };
    }
  }

  private async validatePermissions(templateId: string, userId: string): Promise<void> {
    // Implementar validación de permisos
    // const hasPermission = await this.permissionService.canGenerateDocument(templateId, userId);
    // if (!hasPermission) {
    //   throw new Error('Insufficient permissions to generate document');
    // }
  }

  private async gatherDocumentData(command: GenerateDocumentCommand): Promise<DocumentData> {
    const documentData: Partial<DocumentData> = {
      metadata: {
        templateId: command.templateId,
        templateVersion: '1.0',
        generatedAt: new Date(),
        generatedBy: command.userId,
        purpose: command.purpose,
        customFields: command.customData
      }
    };

    // Recopilar datos del scout si se especifica
    if (command.scoutId) {
      const scoutData = await this.dataMapper.getScoutData(command.scoutId);
      documentData.scout = scoutData;
    }

    // Recopilar datos del grupo si se especifica
    if (command.groupId) {
      const groupData = await this.dataMapper.getGroupData(command.groupId);
      documentData.group = groupData;
    }

    // Recopilar datos de actividad si se especifica
    if (command.activityId) {
      const activityData = await this.dataMapper.getActivityData(command.activityId);
      documentData.activity = activityData;
    }

    return documentData as DocumentData;
  }

  private async validateRequiredData(
    template: DocumentTemplate,
    data: DocumentData
  ): Promise<void> {
    // Validar que todos los campos requeridos tengan datos
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.validation?.required) {
          const value = this.getFieldValue(data, field.dataSource);
          if (value === undefined || value === null || value === '') {
            throw new Error(`Required field missing: ${field.label}`);
          }
        }
      }
    }
  }

  private getFieldValue(data: DocumentData, dataSource: string): any {
    // Implementar navegación de propiedades anidadas
    const path = dataSource.split('.');
    let value: any = data;
    
    for (const key of path) {
      value = value?.[key];
    }
    
    return value;
  }

  private generateFileName(
    template: DocumentTemplate,
    data: DocumentData,
    format: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const scoutName = data.scout ? 
      `${data.scout.nombres}-${data.scout.apellidos}`.replace(/\s+/g, '-') : 
      'documento';
    
    return `${template.name}-${scoutName}-${timestamp}.${format}`;
  }

  private getMimeType(format: string): string {
    const mimeTypes = {
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  private generateUniqueId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}