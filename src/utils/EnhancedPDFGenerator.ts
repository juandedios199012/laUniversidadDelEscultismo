/**
 * Enhanced PDF Document Generator
 * Follows Single Responsibility Principle and uses Template Configuration
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ITemplateConfig, DNGI03TemplateConfig } from '../config/TemplateConfig';

// Scout interface definition (reusing from Word generator)
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

export interface IPDFGenerator {
  generatePDF(scout: Scout): Promise<Uint8Array>;
}

export class EnhancedPDFGenerator implements IPDFGenerator {
  private config: ITemplateConfig;
  private doc: jsPDF;

  constructor(config?: ITemplateConfig) {
    this.config = config || new DNGI03TemplateConfig();
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  }

  async generatePDF(scout: Scout): Promise<Uint8Array> {
    this.setupDocument();
    this.addTitle();
    this.addMainTable(scout);
    this.addMedicalInfoTable(scout);
    
    return new Uint8Array(this.doc.output('arraybuffer'));
  }

  private setupDocument(): void {
    // jsPDF no tiene setMargins, se maneja en autoTable
    // Los márgenes se configuran en cada tabla individualmente
  }

  private addTitle(): void {
    this.doc.setFont(this.config.font.family, 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Datos del Miembro Juvenil (menor de edad)', 20, 30);
  }

  private addMainTable(scout: Scout): void {
    const startY = 45;
    
    // Configuración base de autoTable con tipos corregidos
    const baseConfig = {
      startY: startY,
      theme: 'grid' as const,
      styles: {
        font: this.config.font.family.toLowerCase() as 'helvetica' | 'times' | 'courier',
        fontSize: this.config.font.size,
        cellPadding: this.config.table.cellPadding,
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const,
        halign: 'center' as const,
        valign: 'middle' as const,
      },
      bodyStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        halign: 'left' as const,
        valign: 'middle' as const,
      },
      margin: { left: 20, right: 20 },
    };

    // Tabla 1: Apellidos y Nombres
    autoTable(this.doc, {
      ...baseConfig,
      head: [['APELLIDOS COMPLETOS', 'NOMBRES COMPLETOS']],
      body: [[scout.apellidos || '', scout.nombres || '']],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 95 },
      },
    });

    // Tabla 2: Detalles personales
    const finalY1 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY1,
      head: [['SEXO', 'FECHA DE NACIMIENTO', 'TIPO DOC', 'NÚMERO DOC']],
      body: [[
        scout.sexo || '',
        this.formatDate(scout.fecha_nacimiento) || '',
        scout.tipo_documento || 'DNI',
        scout.numero_documento || ''
      ]],
      columnStyles: {
        0: { cellWidth: 47.5 },
        1: { cellWidth: 47.5 },
        2: { cellWidth: 47.5 },
        3: { cellWidth: 47.5 },
      },
    });

    // Tabla 3: Ubicación Scout
    const finalY2 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY2,
      head: [['REGIÓN', 'LOCALIDAD', 'NUMERAL', 'UNIDAD']],
      body: [['XVIII', 'LIMA', '12', scout.unidad || 'TROPA']],
      columnStyles: {
        0: { cellWidth: 47.5 },
        1: { cellWidth: 47.5 },
        2: { cellWidth: 47.5 },
        3: { cellWidth: 47.5 },
      },
    });

    // Tabla 4: Dirección
    const finalY3 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY3,
      head: [['DIRECCIÓN', 'CÓDIGO POSTAL']],
      body: [[scout.direccion || '', scout.codigo_postal || '']],
      columnStyles: {
        0: { cellWidth: 142.5 },
        1: { cellWidth: 47.5 },
      },
    });

    // Tabla 5: Ubicación geográfica
    const finalY4 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY4,
      head: [['DEPARTAMENTO', 'PROVINCIA', 'DISTRITO']],
      body: [[
        scout.departamento || 'LIMA',
        scout.provincia || 'LIMA',
        scout.distrito || ''
      ]],
      columnStyles: {
        0: { cellWidth: 63.3 },
        1: { cellWidth: 63.3 },
        2: { cellWidth: 63.4 },
      },
    });

    // Tabla 6: Correos electrónicos
    const finalY5 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY5,
      head: [['CORREO INSTITUCIONAL', 'CORREO PERSONAL']],
      body: [[
        scout.correo_institucional || '',
        scout.correo_personal || ''
      ]],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 95 },
      },
    });

    // Tabla 7: Contacto y religión
    const finalY6 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY6,
      head: [['CELULAR', 'TELÉFONO', 'RELIGIÓN']],
      body: [[
        scout.celular || '',
        scout.telefono || '',
        scout.religion || ''
      ]],
      columnStyles: {
        0: { cellWidth: 63.3 },
        1: { cellWidth: 63.3 },
        2: { cellWidth: 63.4 },
      },
    });

    // Tabla 8: Educación
    const finalY7 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY7,
      head: [['CENTRO DE ESTUDIOS', 'AÑO DE ESTUDIOS']],
      body: [[
        scout.centro_estudios || '',
        scout.año_estudios || ''
      ]],
      columnStyles: {
        0: { cellWidth: 142.5 },
        1: { cellWidth: 47.5 },
      },
    });
  }

  private addMedicalInfoTable(scout: Scout): void {
    const finalY = (this.doc as any).lastAutoTable.finalY + 5;
    
    const baseConfig = {
      startY: finalY,
      theme: 'grid' as const,
      styles: {
        font: this.config.font.family.toLowerCase() as 'helvetica' | 'times' | 'courier',
        fontSize: this.config.font.size,
        cellPadding: this.config.table.cellPadding,
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const,
        halign: 'center' as const,
        valign: 'middle' as const,
      },
      bodyStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        halign: 'left' as const,
        valign: 'middle' as const,
      },
      margin: { left: 20, right: 20 },
    };

    // Información médica
    autoTable(this.doc, {
      ...baseConfig,
      head: [['GRUPO SANGUÍNEO', 'FACTOR SANGUÍNEO', 'SEGURO MÉDICO', 'TIPO DISCAPACIDAD']],
      body: [[
        scout.grupo_sanguineo || '',
        scout.factor_sanguineo || '',
        scout.seguro_medico || '',
        scout.tipo_discapacidad || 'NINGUNA'
      ]],
      columnStyles: {
        0: { cellWidth: 47.5 },
        1: { cellWidth: 47.5 },
        2: { cellWidth: 47.5 },
        3: { cellWidth: 47.5 },
      },
    });

    // Campo de observaciones
    const finalY2 = (this.doc as any).lastAutoTable.finalY + 2;
    
    autoTable(this.doc, {
      ...baseConfig,
      startY: finalY2,
      head: [['ESPECIFIQUE DISCAPACIDAD']],
      body: [[scout.observaciones_discapacidad || 'NO APLICA']],
      columnStyles: {
        0: { cellWidth: 190 },
      },
      bodyStyles: {
        ...baseConfig.bodyStyles,
        minCellHeight: 20,
      },
    });
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}