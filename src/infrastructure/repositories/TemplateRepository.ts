// ================================================================
// 📦 Repository: Template Management
// ================================================================

import { DocumentTemplate, DocumentType } from '../../domain/entities/DocumentTemplate';
import { Result, Success, Failure } from '../../domain/entities/Common';
import { DNGI03_INSTITUTIONAL_REGISTRATION_TEMPLATE } from '../templates/DNGI03InstitutionalRegistrationTemplate';

export interface ITemplateRepository {
  getById(id: string): Promise<Result<DocumentTemplate>>;
  getByType(type: DocumentType): Promise<Result<DocumentTemplate[]>>;
  getAll(): Promise<Result<DocumentTemplate[]>>;
  save(template: DocumentTemplate): Promise<Result<DocumentTemplate>>;
  update(id: string, template: Partial<DocumentTemplate>): Promise<Result<DocumentTemplate>>;
  delete(id: string): Promise<Result<boolean>>;
  findByName(name: string): Promise<Result<DocumentTemplate>>;
  getActiveTemplates(): Promise<Result<DocumentTemplate[]>>;
  getTemplatePermissions(templateId: string, userRole: string): Promise<Result<boolean>>;
}

export class TemplateRepository implements ITemplateRepository {
  private static templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    // Inicializar con templates predefinidos
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates = [
      DNGI03_INSTITUTIONAL_REGISTRATION_TEMPLATE
    ];

    defaultTemplates.forEach(template => {
      TemplateRepository.templates.set(template.id, template);
    });
  }

  async getById(id: string): Promise<Result<DocumentTemplate>> {
    try {
      const template = TemplateRepository.templates.get(id);
      
      if (!template) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `Template with id ${id} not found`,
          'TemplateRepository.getById'
        );
      }

      return Success.create(template);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getById'
      );
    }
  }

  async getByType(type: DocumentType): Promise<Result<DocumentTemplate[]>> {
    try {
      const templates = Array.from(TemplateRepository.templates.values())
        .filter(template => template.type === type);

      return Success.create(templates);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving templates by type: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getByType'
      );
    }
  }

  async getAll(): Promise<Result<DocumentTemplate[]>> {
    try {
      const templates = Array.from(TemplateRepository.templates.values());
      return Success.create(templates);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving all templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getAll'
      );
    }
  }

  async save(template: DocumentTemplate): Promise<Result<DocumentTemplate>> {
    try {
      // Validar que el template no exista
      if (TemplateRepository.templates.has(template.id)) {
        return Failure.create(
          'TEMPLATE_ALREADY_EXISTS',
          `Template with id ${template.id} already exists`,
          'TemplateRepository.save'
        );
      }

      // Agregar timestamps
      const templateWithTimestamps = {
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      TemplateRepository.templates.set(template.id, templateWithTimestamps);
      return Success.create(templateWithTimestamps);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_SAVE_ERROR',
        `Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.save'
      );
    }
  }

  async update(id: string, templateUpdate: Partial<DocumentTemplate>): Promise<Result<DocumentTemplate>> {
    try {
      const existingTemplate = TemplateRepository.templates.get(id);
      
      if (!existingTemplate) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `Template with id ${id} not found`,
          'TemplateRepository.update'
        );
      }

      // Merge changes
      const updatedTemplate = {
        ...existingTemplate,
        ...templateUpdate,
        id: existingTemplate.id, // Prevent ID change
        createdAt: existingTemplate.createdAt, // Preserve creation date
        updatedAt: new Date()
      };

      TemplateRepository.templates.set(id, updatedTemplate);
      return Success.create(updatedTemplate);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_UPDATE_ERROR',
        `Error updating template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.update'
      );
    }
  }

  async delete(id: string): Promise<Result<boolean>> {
    try {
      const wasDeleted = TemplateRepository.templates.delete(id);
      
      if (!wasDeleted) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `Template with id ${id} not found`,
          'TemplateRepository.delete'
        );
      }

      return Success.create(true);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_DELETE_ERROR',
        `Error deleting template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.delete'
      );
    }
  }

  async findByName(name: string): Promise<Result<DocumentTemplate>> {
    try {
      const template = Array.from(TemplateRepository.templates.values())
        .find(t => t.name.toLowerCase().includes(name.toLowerCase()));

      if (!template) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `Template with name containing "${name}" not found`,
          'TemplateRepository.findByName'
        );
      }

      return Success.create(template);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_SEARCH_ERROR',
        `Error searching template by name: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.findByName'
      );
    }
  }

  async getActiveTemplates(): Promise<Result<DocumentTemplate[]>> {
    try {
      const activeTemplates = Array.from(TemplateRepository.templates.values())
        .filter(template => template.metadata.isActive);

      return Success.create(activeTemplates);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving active templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getActiveTemplates'
      );
    }
  }

  // ================================================================
  // 🔧 Métodos de utilidad
  // ================================================================

  async getTemplatesByCategory(category: string): Promise<Result<DocumentTemplate[]>> {
    try {
      const templates = Array.from(TemplateRepository.templates.values())
        .filter(template => template.metadata.category === category);

      return Success.create(templates);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving templates by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getTemplatesByCategory'
      );
    }
  }

  async getTemplatesByTags(tags: string[]): Promise<Result<DocumentTemplate[]>> {
    try {
      const templates = Array.from(TemplateRepository.templates.values())
        .filter(template => 
          tags.some(tag => template.metadata.tags.includes(tag))
        );

      return Success.create(templates);
    } catch (error) {
      return Failure.create(
        'TEMPLATE_RETRIEVAL_ERROR',
        `Error retrieving templates by tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getTemplatesByTags'
      );
    }
  }

  async getTemplatePermissions(templateId: string, userRole: string): Promise<Result<boolean>> {
    try {
      const template = TemplateRepository.templates.get(templateId);
      
      if (!template) {
        return Failure.create(
          'TEMPLATE_NOT_FOUND',
          `Template with id ${templateId} not found`,
          'TemplateRepository.getTemplatePermissions'
        );
      }

      const canAccess = template.metadata.permissions.canView.includes(userRole) ||
                       template.metadata.permissions.canEdit.includes(userRole) ||
                       template.metadata.permissions.canGenerate.includes(userRole);

      return Success.create(canAccess);
    } catch (error) {
      return Failure.create(
        'PERMISSION_CHECK_ERROR',
        `Error checking template permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TemplateRepository.getTemplatePermissions'
      );
    }
  }
}