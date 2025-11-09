// ================================================================
// 🏭 Factory: Anexo-3 Document Generator
// ================================================================

import { DocumentTemplate } from '../../domain/entities/DocumentTemplate';
import { DocumentData, ScoutData } from '../../domain/entities/DocumentData';
import { Result, Success, Failure, ILogger, ConsoleLogger } from '../../domain/entities/Common';
import { ITemplateRepository } from '../repositories/TemplateRepository';
import { IDocumentEngine } from '../document-engines/IDocumentEngine';

export interface DocumentGenerationRequest {
  templateId: string;
  scoutId: string;
  outputFormat: 'docx' | 'pdf';
  includeSignatures?: boolean;
  customFields?: Record<string, any>;
  generatedBy: string;
  userRole: string;
}

export interface DocumentGenerationResponse {
  documentBuffer: Buffer;
  filename: string;
  mimeType: string;
  generatedAt: Date;
  templateUsed: string;
}

export class Anexo3DocumentFactory {
  private readonly logger: ILogger;

  constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly documentEngine: IDocumentEngine,
    logger?: ILogger
  ) {
    this.logger = logger || new ConsoleLogger();
  }

  // ================================================================
  // 🔨 Método principal de generación
  // ================================================================

  async generatePersonalDataDocument(
    request: DocumentGenerationRequest
  ): Promise<Result<DocumentGenerationResponse>> {
    try {
      this.logger.info(`Iniciando generación de documento Anexo-3 para scout: ${request.scoutId}`);

      // 1. Validar permisos
      const permissionResult = await this.validatePermissions(request);
      if (permissionResult.isFailure) {
        return Failure.create(
          'PERMISSION_DENIED',
          permissionResult.getError(),
          'Anexo3DocumentFactory.generatePersonalDataDocument'
        );
      }

      // 2. Obtener template
      const templateResult = await this.templateRepository.getById(request.templateId);
      if (templateResult.isFailure) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `No se encontró el template: ${templateResult.getError()}`,
          'Anexo3DocumentFactory.generatePersonalDataDocument'
        );
      }

      const template = templateResult.getValue();

      // 3. Obtener datos del scout
      const scoutDataResult = await this.getScoutData(request.scoutId);
      if (scoutDataResult.isFailure) {
        return Failure.create(
          'SCOUT_DATA_ERROR',
          scoutDataResult.getError(),
          'Anexo3DocumentFactory.generatePersonalDataDocument'
        );
      }

      const scoutData = scoutDataResult.getValue();

      // 4. Preparar datos del documento
      const documentData = this.prepareDocumentData(scoutData, request.customFields);

      // 5. Generar documento
      const documentResult = await this.documentEngine.generateDocument(
        template,
        documentData,
        {
          format: request.outputFormat,
          includeSignatures: request.includeSignatures || true
        }
      );

      if (documentResult.isFailure) {
        return Failure.create(
          'DOCUMENT_GENERATION_ERROR',
          `Error generando documento: ${documentResult.getError()}`,
          'Anexo3DocumentFactory.generatePersonalDataDocument'
        );
      }

      const documentBuffer = documentResult.getValue();

      // 6. Preparar respuesta
      const response: DocumentGenerationResponse = {
        documentBuffer,
        filename: this.generateFilename(scoutData, template),
        mimeType: this.getMimeType(request.outputFormat),
        generatedAt: new Date(),
        templateUsed: template.name
      };

      this.logger.info(`Documento Anexo-3 generado exitosamente para scout: ${request.scoutId}`);
      return Success.create(response);

    } catch (error) {
      this.logger.error('Error inesperado generando documento Anexo-3', error as Error);
      return Failure.create(
        'UNEXPECTED_ERROR',
        `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Anexo3DocumentFactory.generatePersonalDataDocument'
      );
    }
  }

  // ================================================================
  // 🔒 Validación de permisos
  // ================================================================

  private async validatePermissions(request: DocumentGenerationRequest): Promise<Result<boolean>> {
    try {
      // Verificar que el usuario tenga permisos para generar documentos
      const allowedRoles = ['dirigente', 'admin', 'secretario'];
      
      if (!allowedRoles.includes(request.userRole)) {
        return Failure.create(
          'INSUFFICIENT_PERMISSIONS',
          `El rol ${request.userRole} no tiene permisos para generar documentos`,
          'Anexo3DocumentFactory.validatePermissions'
        );
      }

      // Verificar permisos específicos del template
      const templatePermissionResult = await this.templateRepository.getTemplatePermissions(
        request.templateId,
        request.userRole
      );

      if (templatePermissionResult.isFailure) {
        return templatePermissionResult;
      }

      const hasPermission = templatePermissionResult.getValue();
      if (!hasPermission) {
        return Failure.create(
          'TEMPLATE_PERMISSION_DENIED',
          `No tiene permisos para usar el template ${request.templateId}`,
          'Anexo3DocumentFactory.validatePermissions'
        );
      }

      return Success.create(true);
    } catch (error) {
      return Failure.create(
        'PERMISSION_VALIDATION_ERROR',
        `Error validando permisos: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Anexo3DocumentFactory.validatePermissions'
      );
    }
  }

  // ================================================================
  // 📊 Obtención de datos del scout (simulado)
  // ================================================================

  private async getScoutData(scoutId: string): Promise<Result<ScoutData>> {
    try {
      // NOTA: Aquí se conectaría con el ScoutRepository real
      // Por ahora simulamos datos de ejemplo

      const mockScoutData: ScoutData = {
        // Datos personales
        nombres: 'JUAN CARLOS',
        apellidos: 'PÉREZ GONZÁLEZ',
        fechaNacimiento: new Date('2008-05-15'),
        edad: 15,
        sexo: 'Masculino',
        tipoDocumento: 'DNI',
        numeroDocumento: '12345678',
        celular: '+51 987 654 321',
        correo: 'juan.perez@email.com',

        // Dirección
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        direccion: 'Av. Pardo 123, Miraflores',

        // Información educativa
        centroEstudio: 'Colegio San Patricio',
        ocupacion: 'Estudiante',
        centroLaboral: '',

        // Información Scout
        codigoScout: 'L12-2024-001',
        ramaActual: 'Scout',
        estado: 'Activo',
        fechaIngreso: new Date('2022-03-10'),
        tiempoEnMovimiento: '2 años, 8 meses',
        patrulla: {
          nombre: 'Halcones',
          cargo: 'Patrullero'
        },

        // Contacto de emergencia
        contactoEmergencia: {
          nombre: 'MARÍA GONZÁLEZ DÍAZ',
          parentesco: 'Madre',
          celular: '+51 987 123 456',
          celularAlternativo: '+51 954 321 654',
          direccion: 'Av. Pardo 123, Miraflores'
        },

        // Observaciones
        observaciones: 'Scout comprometido con excelente participación en actividades.'
      };

      this.logger.info(`Datos del scout ${scoutId} obtenidos exitosamente`);
      return Success.create(mockScoutData);

    } catch (error) {
      this.logger.error(`Error obteniendo datos del scout ${scoutId}`, error as Error);
      return Failure.create(
        'SCOUT_DATA_ERROR',
        `Error obteniendo datos del scout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Anexo3DocumentFactory.getScoutData'
      );
    }
  }

  // ================================================================
  // 🔧 Preparación de datos del documento
  // ================================================================

  private prepareDocumentData(scoutData: ScoutData, customFields?: Record<string, any>): DocumentData {
    const documentData: DocumentData = {
      scout: scoutData,
      group: {
        nombre: 'Grupo Scout Lima 12',
        numero: '12',
        distrito: 'Perú',
        region: 'Lima',
        fechaFundacion: new Date('1985-06-15'),
        totalMiembros: 85,
        totalDirigentes: 12,
        totalScouts: 73
      },
      activity: undefined, // No aplica para este documento
      generatedAt: new Date(),
      generatedBy: 'Sistema de Gestión Scout',
      version: '1.0',
      metadata: {
        documentType: 'ANEXO_3_DATOS_PERSONALES',
        scoutId: scoutData.numeroDocumento,
        templateVersion: '1.0',
        customFields: customFields || {}
      }
    };

    return documentData;
  }

  // ================================================================
  // 📁 Generación de nombre de archivo
  // ================================================================

  private generateFilename(scoutData: ScoutData, template: DocumentTemplate): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const scoutName = `${scoutData.apellidos}_${scoutData.nombres}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toUpperCase();

    return `${template.id}_${scoutName}_${dateStr}.docx`;
  }

  // ================================================================
  // 🎯 Utilidades
  // ================================================================

  private getMimeType(format: 'docx' | 'pdf'): string {
    switch (format) {
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  // ================================================================
  // 📊 Métodos de consulta
  // ================================================================

  async getAvailableTemplates(userRole: string): Promise<Result<DocumentTemplate[]>> {
    try {
      const templatesResult = await this.templateRepository.getActiveTemplates();
      if (templatesResult.isFailure) {
        return templatesResult;
      }

      const templates = templatesResult.getValue();
      
      // Filtrar templates por permisos del usuario
      const allowedTemplates: DocumentTemplate[] = [];
      
      for (const template of templates) {
        const permissionResult = await this.templateRepository.getTemplatePermissions(template.id, userRole);
        if (permissionResult.isSuccess && permissionResult.getValue()) {
          allowedTemplates.push(template);
        }
      }

      return Success.create(allowedTemplates);

    } catch (error) {
      return Failure.create(
        'TEMPLATE_QUERY_ERROR',
        `Error obteniendo templates disponibles: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Anexo3DocumentFactory.getAvailableTemplates'
      );
    }
  }

  async validateDocumentRequest(request: DocumentGenerationRequest): Promise<Result<boolean>> {
    try {
      // Validar campos requeridos
      if (!request.templateId) {
        return Failure.create('INVALID_REQUEST', 'Template ID es requerido', 'validateDocumentRequest');
      }

      if (!request.scoutId) {
        return Failure.create('INVALID_REQUEST', 'Scout ID es requerido', 'validateDocumentRequest');
      }

      if (!request.userRole) {
        return Failure.create('INVALID_REQUEST', 'Rol de usuario es requerido', 'validateDocumentRequest');
      }

      if (!request.generatedBy) {
        return Failure.create('INVALID_REQUEST', 'Generado por es requerido', 'validateDocumentRequest');
      }

      // Validar formato de salida
      const validFormats = ['docx', 'pdf'];
      if (!validFormats.includes(request.outputFormat)) {
        return Failure.create('INVALID_REQUEST', 'Formato de salida no válido', 'validateDocumentRequest');
      }

      return Success.create(true);

    } catch (error) {
      return Failure.create(
        'VALIDATION_ERROR',
        `Error validando solicitud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Anexo3DocumentFactory.validateDocumentRequest'
      );
    }
  }
}